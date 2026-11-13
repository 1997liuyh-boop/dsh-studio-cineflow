// 采集站聚合搜索核心的单元测试（样本为自行编写）
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTitle, parseNumberToken, splitSeason, includesKeyword, isRelevant,
  isNoise, isAdult, parseCmsList, readPageCount, filterSearchItems, aggregateResults, splitPlayGroups, parseDetailMeta
} from '../electron/vod-core.mjs';

test('片名归一化去掉空白与中英文标点', () => {
  assert.equal(normalizeTitle('蜘蛛侠：英雄 无归！'), '蜘蛛侠英雄无归');
  assert.equal(normalizeTitle('JOJO的奇妙冒险 Part.2'), 'jojo的奇妙冒险part2');
});

test('中文数字解析', () => {
  assert.equal(parseNumberToken('十二'), 12);
  assert.equal(parseNumberToken('二十'), 20);
  assert.equal(parseNumberToken('两'), 2);
  assert.ok(Number.isNaN(parseNumberToken('甲')));
});

test('季号识别：查询侧允许尾部数字紧贴，片名侧必须带空格', () => {
  assert.deepEqual(splitSeason('庆余年第二季'), { base: '庆余年', season: 2 });
  assert.deepEqual(splitSeason('庆余年2', { side: 'query' }), { base: '庆余年', season: 2 });
  assert.equal(splitSeason('蜘蛛侠3').season, 0);
  assert.equal(splitSeason('2046').season, 0);
  assert.equal(splitSeason('隐秘的角落 2').season, 2);
});

test('数字关键词不与相邻数字粘连', () => {
  assert.ok(includesKeyword('庆余年2', '庆余年2'));
  assert.ok(!includesKeyword('庆余年12', '年1'));
  assert.ok(!includesKeyword('庆余年12', '2'));
});

test('相关性判断', () => {
  assert.ok(isRelevant('JOJO的奇妙冒险 星尘斗士 埃及篇', 'JOJO的奇妙冒险'));
  assert.ok(isRelevant('你的好邻居蜘蛛侠第一季', '蜘蛛侠'));
  assert.ok(isRelevant('庆余年第二季', '庆余年2'));
  assert.ok(!isRelevant('庆余年第一季', '庆余年2'));
  assert.ok(!isRelevant('爸爸去哪儿', '摔跤吧！爸爸'));
  assert.ok(isRelevant('蜘蛛侠 英雄归来', '蜘蛛侠 归来'));
  assert.ok(isRelevant('蜘蛛侠：英雄无归', '蜘蛛侠：英雄无归加长版'));
  assert.ok(!isRelevant('乔乔的异想世界', 'JOJO的奇妙冒险'));
});

test('解说类与成人分类识别', () => {
  assert.ok(isNoise({ name: '蜘蛛侠3[电影解说]' }));
  assert.ok(!isNoise({ name: '蜘蛛侠3', typeName: '动作片' }));
  assert.ok(isAdult({ typeName: '伦理片' }));
  assert.ok(!isAdult({ typeName: '日韩动漫' }));
});

test('解析采集站列表与总页数', () => {
  const payload = { pagecount: '9', list: [
    { vod_id: 12, vod_name: '石之海', vod_pic: 'https://img/a.jpg', type_name: '日韩动漫', vod_year: '2021', vod_remarks: '完结' },
    { vod_id: 13, vod_name: '', vod_pic: '' },
    { vod_id: 14, vod_name: '黄金之风', vod_pic: 'javascript:alert(1)' }
  ] };
  const items = parseCmsList(payload, { key: 'lzi', name: '量子资源' });
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], { sourceKey: 'lzi', sourceName: '量子资源', vodId: '12', name: '石之海', pic: 'https://img/a.jpg', typeName: '日韩动漫', year: '2021', area: '', remarks: '完结', updatedAt: '' });
  assert.equal(items[1].pic, '');
  assert.equal(readPageCount(payload), 9);
  assert.equal(readPageCount({}), 1);
  assert.equal(readPageCount({ pagecount: 'x' }), 1);
});

test('单源过滤：去重、成人、相关性', () => {
  const items = [
    { sourceKey: 'a', vodId: '1', name: '蜘蛛侠', typeName: '动作片' },
    { sourceKey: 'a', vodId: '1', name: '蜘蛛侠', typeName: '动作片' },
    { sourceKey: 'a', vodId: '2', name: '蜘蛛侠', typeName: '伦理片' },
    { sourceKey: 'a', vodId: '3', name: '钢铁侠', typeName: '动作片' }
  ];
  assert.deepEqual(filterSearchItems(items, '蜘蛛侠').map((item) => item.vodId), ['1']);
});

test('跨源聚合：同名合并、年份冲突拆分、排序', () => {
  const items = [
    { sourceKey: 'a', vodId: '1', name: '蜘蛛侠2', year: '2004' },
    { sourceKey: 'b', vodId: '9', name: '蜘蛛侠 2', year: '2004' },
    { sourceKey: 'a', vodId: '2', name: '蜘蛛侠', year: '2002' },
    { sourceKey: 'b', vodId: '3', name: '蜘蛛侠', year: '1977' },
    { sourceKey: 'c', vodId: '4', name: '蜘蛛侠', year: '' },
    { sourceKey: 'a', vodId: '5', name: '蜘蛛侠[电影解说]', year: '2002' },
    { sourceKey: 'b', vodId: '6', name: '超凡蜘蛛侠', year: '2012' },
    { sourceKey: 'c', vodId: '7', name: '超凡蜘蛛侠', year: '2012' }
  ];
  const groups = aggregateResults(items, '蜘蛛侠');
  const keys = groups.map((group) => `${group.name}|${group.year}|${group.sourceCount}`);
  assert.deepEqual(keys.slice(0, 3), ['蜘蛛侠|2002|1', '蜘蛛侠|1977|1', '蜘蛛侠||1']);
  assert.equal(groups.find((group) => group.name.startsWith('蜘蛛侠2') || group.name.startsWith('蜘蛛侠 2')).sourceCount, 2);
  assert.ok(groups.at(-1).noise, '解说条目排在最后');
  const amazing = groups.find((group) => group.name === '超凡蜘蛛侠');
  assert.equal(amazing.sourceCount, 2);
});

test('播放地址拆分：保留集名、直链线路优先、过滤非 http', () => {
  const groups = splitPlayGroups({
    vod_play_from: 'share$$$m3u8',
    vod_play_url: '第1集$https://a/share/1#第2集$https://a/share/2$$$第1集$https://b/1/index.m3u8#第2集$https://b/2/index.m3u8#坏数据$ftp://x'
  });
  assert.equal(groups[0].name, 'm3u8');
  assert.deepEqual(groups[0].episodes, [{ label: '第1集', url: 'https://b/1/index.m3u8' }, { label: '第2集', url: 'https://b/2/index.m3u8' }]);
  assert.equal(groups[1].name, 'share');
  const bare = splitPlayGroups({ vod_play_url: 'https://c/x.m3u8' });
  assert.deepEqual(bare, [{ name: '线路 1', episodes: [{ label: '第1集', url: 'https://c/x.m3u8' }] }]);
});

test('详情元数据去掉 HTML 标签', () => {
  const meta = parseDetailMeta({ vod_id: 5, vod_name: '石之海', vod_content: '<p>徐伦&nbsp;被陷害</p>' }, { key: 'k', name: 'n' });
  assert.equal(meta.content, '徐伦 被陷害');
  assert.equal(meta.vodId, '5');
});
