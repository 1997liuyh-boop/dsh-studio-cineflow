// m3u8 广告分组过滤的单元测试（样本为自行构造的清单）
const test = require('node:test');
const assert = require('node:assert/strict');
const { filterAdsFromM3u8 } = require('../electron/ad-filter.cjs');

function playlist(groups, { endlist = true } = {}) {
  const lines = ['#EXTM3U', '#EXT-X-VERSION:3', '#EXT-X-TARGETDURATION:10'];
  groups.forEach((group, groupIndex) => {
    if (groupIndex > 0) lines.push('#EXT-X-DISCONTINUITY');
    group.forEach(([duration, uri]) => {
      lines.push(`#EXTINF:${duration},`);
      lines.push(uri);
    });
  });
  if (endlist) lines.push('#EXT-X-ENDLIST');
  return lines.join('\n');
}

const content = (count, base = 'https://cdn.example/v/1/') => Array.from({ length: count }, (_, i) => [6, `${base}seg${i}.ts`]);
const uris = (text) => text.split('\n').filter((line) => line && !line.startsWith('#'));

test('删除插在正片中间的短广告分组', () => {
  const text = playlist([content(60), [[5, 'https://ad.example/x/a1.ts'], [5, 'https://ad.example/x/a2.ts']], content(60, 'https://cdn.example/v/2/')]);
  const out = uris(filterAdsFromM3u8(text));
  assert.equal(out.length, 120);
  assert.ok(out.every((uri) => uri.includes('cdn.example')));
});

test('分片地址带广告特征的分组无论时长都删除', () => {
  const ads = Array.from({ length: 20 }, (_, i) => [10, `https://cdn.example/adjump/${i}.ts`]);
  const out = uris(filterAdsFromM3u8(playlist([content(10), ads, content(10)])));
  assert.equal(out.length, 20);
  assert.ok(!out.some((uri) => uri.includes('adjump')));
});

test('编码器分段（多组且时长接近）不误删正片', () => {
  const groups = [content(20), content(18, 'https://cdn.example/v/2/'), content(22, 'https://cdn.example/v/3/'), content(19, 'https://cdn.example/v/4/')];
  const out = uris(filterAdsFromM3u8(playlist(groups)));
  assert.equal(out.length, 79);
});

test('编码器分段中夹带的外部短广告仍会删除', () => {
  const groups = [content(20), content(18), [[6, 'https://ads.other/p/1.ts'], [6, 'https://ads.other/p/2.ts']], content(22), content(19)];
  const out = uris(filterAdsFromM3u8(playlist(groups)));
  assert.equal(out.length, 79);
  assert.ok(!out.some((uri) => uri.includes('ads.other')));
});

test('直播清单（无 ENDLIST）不做分组删除', () => {
  const text = playlist([content(3), [[5, 'https://ad.example/x/a1.ts']], content(3)], { endlist: false });
  assert.equal(uris(filterAdsFromM3u8(text)).length, 7);
});

test('非字符串与异常输入原样返回', () => {
  assert.equal(filterAdsFromM3u8(''), '');
  assert.equal(filterAdsFromM3u8('not a playlist'), 'not a playlist');
});
