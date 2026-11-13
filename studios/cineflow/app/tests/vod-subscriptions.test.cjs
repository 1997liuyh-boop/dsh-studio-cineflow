// 片源订阅解析的单元测试（样本为自行编写）
const test = require('node:test');
const assert = require('node:assert/strict');
const { stripJsonNoise, parseSubscription, isDue, buildExport } = require('../electron/vod-subscriptions.cjs');

test('容忍 BOM、注释、尾逗号与字符串内的原始换行', () => {
  const text = String.fromCharCode(0xFEFF) + `{
    // 行注释
    "name": "我的源", /* 块注释 */
    "note": "第一行
第二行",
    "sources": [{ "name": "量子", "url": "https://cj.lziapi.com/api.php/provide/vod/" },],
  }`;
  const json = JSON.parse(stripJsonNoise(text));
  assert.equal(json.name, '我的源');
  assert.equal(json.note, '第一行\n第二行');
  assert.equal(json.sources.length, 1);
  assert.equal(stripJsonNoise('{"url":"http://a.com//x"}'), '{"url":"http://a.com//x"}', '字符串里的 // 不是注释');
});

test('LibreTV 源列表：点播与直播、去重、去掉结尾斜杠', () => {
  const result = parseSubscription(JSON.stringify({
    name: '合集',
    sources: [
      { name: '量子', url: 'https://cj.lziapi.com/api.php/provide/vod/' },
      { name: '量子重复', url: 'http://cj.lziapi.com/api.php/provide/vod' },
      { name: '坏地址', url: 'ftp://x' }
    ],
    liveSources: [{ name: '直播', url: 'https://iptv.example/list.m3u', epg: 'https://iptv.example/epg.xml.gz' }]
  }));
  assert.equal(result.name, '合集');
  assert.deepEqual(result.sources, [{ name: '量子', url: 'https://cj.lziapi.com/api.php/provide/vod' }]);
  assert.equal(result.liveSources[0].epg, 'https://iptv.example/epg.xml.gz');
  assert.equal(result.stats.skipped, 1);
  assert.equal(parseSubscription('[{"url":"https://a.example/api.php/provide/vod"}]').sources[0].name, 'a.example');
});

test('TVBox 配置：只取可直接使用的 MacCMS 接口与 M3U 直播', () => {
  const result = parseSubscription(JSON.stringify({
    sites: [
      { key: 'a', name: '暴风', type: 1, api: 'https://bfzyapi.com/api.php/provide/vod/' },
      { key: 'b', name: '爬虫', type: 3, api: 'csp_Demo' },
      { key: 'c', name: 'jar', type: 1, api: 'https://x.example/spider.jar' },
      { key: 'd', name: '不可搜', type: 1, api: 'https://y.example/api.php/provide/vod', searchable: 0 },
      { key: 'e', name: 'XML', type: 0, api: 'https://z.example/api.php/provide/vod/at/xml' }
    ],
    lives: [
      { name: '电视', type: 0, url: 'https://iptv.example/tv.m3u' },
      { name: '文本', type: 0, url: 'https://iptv.example/tv.txt' }
    ]
  }));
  assert.equal(result.stats.format, 'tvbox');
  assert.deepEqual(result.sources.map((source) => source.name), ['暴风', 'XML']);
  assert.equal(result.liveSources.length, 1);
  assert.equal(result.stats.skippedByReason['需要专用爬虫引擎'], 2);
  assert.equal(result.stats.skippedByReason['不支持搜索'], 1);
  assert.equal(result.stats.skippedByReason['TXT 直播列表暂不支持'], 1);
});

test('没有可用接口或格式无法识别时报错', () => {
  assert.throws(() => parseSubscription('not json'), /不是有效的 JSON/);
  assert.throws(() => parseSubscription('{"foo":1}'), /无法识别/);
  assert.throws(() => parseSubscription('{"sites":[{"type":3,"api":"csp_x"}]}'), /没有可直接使用的接口/);
});

test('自动刷新到期判断', () => {
  const day = 24 * 60 * 60 * 1000;
  assert.ok(isDue({ refreshDays: 1 }, 0));
  assert.ok(isDue({ refreshDays: 1, lastSync: 1 }, day + 1));
  assert.ok(!isDue({ refreshDays: 7, lastSync: 1 }, day));
  assert.ok(!isDue({ refreshDays: 0 }, day), '仅手动');
  assert.ok(!isDue({ refreshDays: 1, failStreak: 3 }, day), '连续失败后暂停');
  assert.ok(!isDue({ refreshDays: 1, enabled: false }, day));
});

test('导出为 LibreTV 源列表格式', () => {
  const output = buildExport({ sources: [{ name: '量子', api: 'https://a/api.php/provide/vod' }], liveSources: [{ name: '电视', url: 'https://b/tv.m3u', epg: '' }] });
  assert.deepEqual(output.sources, [{ name: '量子', url: 'https://a/api.php/provide/vod' }]);
  assert.deepEqual(output.liveSources, [{ name: '电视', url: 'https://b/tv.m3u' }]);
});

test('内置订阅只预置一次，用户删除后不再补回', () => {
  const { seedBuiltinSubscriptions, BUILTIN_SUBSCRIPTIONS } = require('../electron/vod-subscriptions.cjs');
  const settings = { subscriptions: [{ url: BUILTIN_SUBSCRIPTIONS[0].url, name: '用户自己加的' }] };
  assert.equal(seedBuiltinSubscriptions(settings), true);
  assert.equal(settings.subscriptions.length, BUILTIN_SUBSCRIPTIONS.length, '已存在的地址不重复添加');
  assert.equal(settings.subscriptions[0].name, '用户自己加的');
  assert.ok(settings.subscriptions.slice(1).every((item) => item.builtin && item.refreshDays === 1));
  settings.subscriptions = [];
  assert.equal(seedBuiltinSubscriptions(settings), false);
  assert.deepEqual(settings.subscriptions, []);
});

test('跳过标记为成人或名称为成人内容的接口', () => {
  const libre = parseSubscription(JSON.stringify({ sources: [
    { name: '量子', url: 'https://a.example/api.php/provide/vod' },
    { name: '某资源', url: 'https://b.example/api.php/provide/vod', isAdult: true },
    { name: '🔞小鸡资源', url: 'https://c.example/api.php/provide/vod' }
  ] }));
  assert.deepEqual(libre.sources.map((source) => source.name), ['量子']);
  assert.equal(libre.stats.skippedByReason['成人内容'], 2);
  const tvbox = parseSubscription(JSON.stringify({ sites: [
    { name: '暴风', type: 1, api: 'https://d.example/api.php/provide/vod' },
    { name: '福利资源', type: 1, api: 'https://e.example/api.php/provide/vod' }
  ] }));
  assert.deepEqual(tvbox.sources.map((source) => source.name), ['暴风']);
});

test('主地址失败时依次尝试镜像', async () => {
  const { createSubscriptionService } = require('../electron/vod-subscriptions.cjs');
  let settings = { subscriptions: [{ url: 'https://main.example/s.json', mirrors: ['https://mirror.example/s.json'], refreshDays: 1 }] };
  const tried = [];
  const service = createSubscriptionService({
    ipcMain: { handle() {} },
    fetchText: async (url) => {
      tried.push(url);
      if (url.startsWith('https://main.')) throw new Error('HTTP 404');
      return JSON.stringify({ sources: [{ name: '量子', url: 'https://a.example/api.php/provide/vod' }] });
    },
    readSettings: () => JSON.parse(JSON.stringify(settings)),
    writeSettings: (next) => { settings = next; },
    listExportSources: () => []
  });
  const result = await service.sync('https://main.example/s.json', { manual: true });
  assert.equal(result.ok, true);
  assert.deepEqual(tried, ['https://main.example/s.json', 'https://mirror.example/s.json']);
  assert.equal(settings.subscriptionSources.length, 1);
  assert.equal(settings.subscriptionSources[0].subscription, 'https://main.example/s.json');
});
