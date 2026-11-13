// 直播 M3U / XMLTV 解析的单元测试（样本为自行编写）
const test = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const live = require('../electron/live-core.cjs');
const { decodeText, normalizeLiveEntry } = require('../electron/live-service.cjs');

const M3U = [
  '#EXTM3U x-tvg-url="https://epg.example/e.xml.gz,https://backup.example/e.xml"',
  '#EXTINF:-1 tvg-id="CCTV1" tvg-name="CCTV-1" tvg-logo="logo/cctv1.png" group-title="央视",CCTV-1 综合',
  'https://live.example/cctv1/index.m3u8',
  '#EXTINF:-1 tvg-name="凤凰中文",凤凰中文, 高清',
  '#EXTGRP:港澳台',
  'stream/phoenix.m3u8',
  '#EXTINF:-1 group-title="央视",重复地址',
  'https://live.example/cctv1/index.m3u8',
  '#EXTINF:-1,不支持的协议',
  'rtmp://x.example/live',
  ''
].join('\r\n');

test('M3U：属性、频道名中的逗号、相对地址、分组回退、去重', () => {
  const { epgUrl, channels } = live.parseM3u(M3U, 'https://live.example/lists/tv.m3u');
  assert.equal(epgUrl, 'https://epg.example/e.xml.gz');
  assert.equal(channels.length, 2);
  assert.equal(channels[0].name, 'CCTV-1 综合');
  assert.equal(channels[0].tvgId, 'CCTV1');
  assert.equal(channels[0].logo, 'https://live.example/lists/logo/cctv1.png');
  assert.equal(channels[0].group, '央视');
  assert.equal(channels[1].name, '凤凰中文, 高清');
  assert.equal(channels[1].url, 'https://live.example/lists/stream/phoenix.m3u8');
  assert.equal(channels[1].group, '港澳台');
  assert.equal(channels[1].logo, '', '没有台标时不能解析成播放列表地址');
  const emptyEpg = ['#EXTM3U x-tvg-url=""', '#EXTINF:-1,A', 'https://a/1.m3u8'].join('\n');
  assert.equal(live.parseM3u(emptyEpg, 'https://a/list.m3u').epgUrl, '', '空的节目单地址不能解析成播放列表地址');
  assert.notEqual(channels[0].id, channels[1].id);
});

test('XMLTV 时间换算时区', () => {
  assert.equal(live.parseXmltvTime('20261113200000 +0800'), Date.UTC(2026, 10, 13, 12, 0, 0));
  assert.equal(live.parseXmltvTime('20261113120000 Z'), Date.UTC(2026, 10, 13, 12, 0, 0));
  assert.equal(live.parseXmltvTime('20261113120000'), Date.UTC(2026, 10, 13, 12, 0, 0));
  assert.ok(Number.isNaN(live.parseXmltvTime('bad')));
});

test('XMLTV：节目窗口、实体解码、按显示名匹配频道', () => {
  const now = Date.UTC(2026, 10, 13, 12, 30, 0);
  const xml = `<?xml version="1.0"?><tv>
    <channel id="cctv1"><display-name lang="zh">CCTV-1</display-name><display-name>CCTV1综合</display-name></channel>
    <programme start="20261113200000 +0800" stop="20261113210000 +0800" channel="cctv1"><title lang="zh">新闻联播 &amp; 天气</title></programme>
    <programme start="20261113210000 +0800" stop="20261113220000 +0800" channel="cctv1"><title><![CDATA[焦点访谈]]></title></programme>
    <programme start="20261110200000 +0800" stop="20261110210000 +0800" channel="cctv1"><title>过期节目</title></programme>
  </tv>`;
  const epg = live.parseXmltv(xml, { now });
  assert.equal(epg.programmes.get('cctv1').length, 2);
  const { now: current, next } = live.currentAndNext(epg.programmes.get('cctv1'), now);
  assert.equal(current.title, '新闻联播 & 天气');
  assert.equal(next.title, '焦点访谈');
  const index = live.buildEpgIndex(epg);
  assert.equal(index.lookup({ tvgId: '', tvgName: '', name: 'cctv 1' }), 'cctv1');
  assert.equal(index.lookup({ tvgId: 'none', tvgName: 'CCTV1综合', name: 'x' }), 'cctv1');
  assert.equal(index.lookup({ tvgId: '', tvgName: '', name: '不存在' }), '');
});

test('gzip 节目单自动解压；直播源条目校验', () => {
  assert.equal(decodeText(zlib.gzipSync(Buffer.from('<tv></tv>'))), '<tv></tv>');
  assert.equal(decodeText(Buffer.from('plain')), 'plain');
  assert.deepEqual(normalizeLiveEntry({ url: 'https://a.example/tv.m3u', epg: 'ftp://x' }), { name: 'a.example', url: 'https://a.example/tv.m3u', epg: '' });
  assert.equal(normalizeLiveEntry({ url: 'rtmp://x' }), null);
});
