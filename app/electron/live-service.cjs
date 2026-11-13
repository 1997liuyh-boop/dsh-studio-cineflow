// 直播 IPTV 服务：直播源管理、播放列表与节目单拉取（带缓存）、频道测活。
// 依赖由 main.cjs 注入：fetchBuffer 负责代理、超时与请求头。

const zlib = require('node:zlib');
const live = require('./live-core.cjs');

const PLAYLIST_TTL_MS = 10 * 60 * 1000;
const EPG_TTL_MS = 6 * 60 * 60 * 1000;
const PROBE_TIMEOUT_MS = 8000;
const PROBE_CONCURRENCY = 8;
const MAX_LIVE_SOURCES = 100;

function decodeText(buffer) {
  const bytes = Buffer.from(buffer);
  // gzip 压缩的节目单（.xml.gz）按魔数自动解压
  const raw = bytes[0] === 0x1f && bytes[1] === 0x8b ? zlib.gunzipSync(bytes) : bytes;
  return raw.toString('utf8');
}

function normalizeLiveEntry(entry) {
  const url = String(entry?.url || '').trim();
  if (!/^https?:\/\//i.test(url)) return null;
  const epg = String(entry?.epg || '').trim();
  let host = '';
  try { host = new URL(url).hostname; } catch { return null; }
  return {
    name: String(entry?.name || host).trim().slice(0, 60),
    url,
    epg: /^https?:\/\//i.test(epg) ? epg : ''
  };
}

function createLiveService({ ipcMain, readSettings, writeSettings, fetchBuffer, fetchResponse }) {
  const playlistCache = new Map(); // url → { at, value }
  const epgCache = new Map(); // url → { at, epg, index }
  const epgInflight = new Map();

  function listSources(settings = readSettings()) {
    const custom = (Array.isArray(settings.liveSources) ? settings.liveSources : []).map((item) => ({ ...item, origin: 'custom' }));
    const subscribed = (Array.isArray(settings.subscriptionLiveSources) ? settings.subscriptionLiveSources : []).map((item) => ({ ...item, origin: 'subscription' }));
    const seen = new Set();
    return [...custom, ...subscribed].filter((item) => {
      if (!item?.url || seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
  }

  function saveSources(list) {
    const entries = (Array.isArray(list) ? list : []).map(normalizeLiveEntry).filter(Boolean);
    const seen = new Set();
    const unique = entries.filter((item) => (seen.has(item.url) ? false : seen.add(item.url))).slice(0, MAX_LIVE_SOURCES);
    const settings = readSettings();
    settings.liveSources = unique;
    writeSettings(settings);
    return listSources(settings);
  }

  async function playlist(url, { force = false } = {}) {
    const target = String(url || '');
    const cached = playlistCache.get(target);
    if (!force && cached && Date.now() - cached.at < PLAYLIST_TTL_MS) return cached.value;
    try {
      const parsed = live.parseM3u(decodeText(await fetchBuffer(target, { timeoutMs: 15000 })), target);
      if (!parsed.channels.length) return { ok: false, error: '播放列表里没有可用频道（需要 M3U 格式）', channels: [] };
      const groups = new Map();
      for (const channel of parsed.channels) groups.set(channel.group, (groups.get(channel.group) || 0) + 1);
      const value = {
        ok: true,
        epgUrl: parsed.epgUrl,
        channels: parsed.channels,
        groups: [...groups.entries()].map(([name, count]) => ({ name, count }))
      };
      playlistCache.set(target, { at: Date.now(), value });
      return value;
    } catch (error) {
      return { ok: false, error: `播放列表读取失败：${String(error?.message || error).slice(0, 120)}`, channels: [] };
    }
  }

  async function loadEpg(url) {
    const cached = epgCache.get(url);
    if (cached && Date.now() - cached.at < EPG_TTL_MS) return cached;
    if (epgInflight.has(url)) return epgInflight.get(url);
    const task = (async () => {
      const epg = live.parseXmltv(decodeText(await fetchBuffer(url, { timeoutMs: 30000 })));
      const entry = { at: Date.now(), epg, index: live.buildEpgIndex(epg) };
      epgCache.set(url, entry);
      return entry;
    })().finally(() => epgInflight.delete(url));
    epgInflight.set(url, task);
    return task;
  }

  /** 查询一批频道的「正在播 / 下一个」，channels: [{ id, tvgId, tvgName, name }]（最多 500 个）。 */
  async function epgFor(url, channels) {
    if (!/^https?:\/\//i.test(String(url || ''))) return { ok: false, error: '没有节目单地址', items: {} };
    try {
      const { epg, index } = await loadEpg(String(url));
      const now = Date.now();
      const items = {};
      for (const channel of (Array.isArray(channels) ? channels : []).slice(0, 500)) {
        const id = index.lookup(channel);
        if (!id) continue;
        const { now: current, next } = live.currentAndNext(epg.programmes.get(id) || [], now);
        if (current || next) items[channel.id] = { now: current, next };
      }
      return { ok: true, items };
    } catch (error) {
      return { ok: false, error: `节目单读取失败：${String(error?.message || error).slice(0, 120)}`, items: {} };
    }
  }

  /** 测活单个频道：HLS 读清单（多码率时跟进第一个子清单）后请求最后一个分片的前 2 个字节；其它格式只看响应状态。 */
  async function probeOne(url) {
    const startedAt = Date.now();
    const deadline = startedAt + PROBE_TIMEOUT_MS;
    const remaining = () => Math.max(500, deadline - Date.now());
    try {
      let target = url;
      for (let hop = 0; hop < 3; hop += 1) {
        const response = await fetchResponse(target, { timeoutMs: remaining() });
        if (!response.ok) return { url, ok: false, ms: Date.now() - startedAt, error: `HTTP ${response.status}` };
        const type = String(response.headers.get('content-type') || '').toLowerCase();
        const looksHls = /mpegurl|m3u8/.test(type) || /\.m3u8(?:$|[?#])/i.test(target);
        if (!looksHls) {
          response.body?.cancel?.().catch(() => {});
          return { url, ok: true, ms: Date.now() - startedAt, level: 'head' };
        }
        const text = await response.text();
        if (!/#EXTM3U/i.test(text)) return { url, ok: false, ms: Date.now() - startedAt, error: '不是有效的直播清单' };
        const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        const variantIndex = lines.findIndex((line) => /^#EXT-X-STREAM-INF/i.test(line));
        if (variantIndex >= 0) {
          const variant = lines.slice(variantIndex + 1).find((line) => !line.startsWith('#'));
          if (!variant) break;
          target = new URL(variant, response.url || target).toString();
          continue;
        }
        const segments = lines.filter((line) => !line.startsWith('#'));
        if (!segments.length) return { url, ok: false, ms: Date.now() - startedAt, error: '清单里没有分片' };
        const segmentUrl = new URL(segments[segments.length - 1], response.url || target).toString();
        const segment = await fetchResponse(segmentUrl, { timeoutMs: remaining(), headers: { range: 'bytes=0-1' } });
        segment.body?.cancel?.().catch(() => {});
        return segment.ok
          ? { url, ok: true, ms: Date.now() - startedAt, level: 'segment' }
          : { url, ok: false, ms: Date.now() - startedAt, error: `分片 HTTP ${segment.status}` };
      }
      return { url, ok: false, ms: Date.now() - startedAt, error: '清单层级过深' };
    } catch (error) {
      const timedOut = Date.now() >= deadline - 50 || error?.name === 'AbortError';
      return { url, ok: false, ms: Date.now() - startedAt, error: timedOut ? '超时' : String(error?.message || error).slice(0, 80) };
    }
  }

  async function probe(urls) {
    const list = (Array.isArray(urls) ? urls : []).filter((url) => /^https?:\/\//i.test(String(url))).slice(0, 200);
    const results = [];
    let cursor = 0;
    const worker = async () => {
      while (cursor < list.length) {
        const url = list[cursor++];
        results.push(await probeOne(url));
      }
    };
    await Promise.all(Array.from({ length: Math.min(PROBE_CONCURRENCY, list.length) }, worker));
    return results;
  }

  ipcMain.handle('live:sources', async () => listSources());
  ipcMain.handle('live:saveSources', async (_event, list) => saveSources(list));
  ipcMain.handle('live:playlist', async (_event, url, options) => playlist(url, options || {}));
  ipcMain.handle('live:epg', async (_event, url, channels) => epgFor(url, channels));
  ipcMain.handle('live:probe', async (_event, urls) => probe(urls));

  return { listSources, saveSources, playlist, epgFor, probe };
}

module.exports = { createLiveService, normalizeLiveEntry, decodeText };
