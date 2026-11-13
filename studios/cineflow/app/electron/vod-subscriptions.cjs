// 片源订阅：解析远程源列表（LibreTV-SourceList JSON / TVBox 配置），定期静默刷新，导出当前片源。
// 订阅格式参考 LibreTV-Next 的公开约定，代码为独立实现。订阅导入的接口单独存放，不覆盖用户的自定义源。

const MAX_VOD_SOURCES = 200;
const MAX_LIVE_SOURCES = 100;
const AUTO_SYNC_LIMIT = 5; // 每次启动最多自动刷新的订阅数
const AUTO_SYNC_CONCURRENCY = 2;
const AUTO_PAUSE_FAILS = 3; // 自动刷新连续失败几次后暂停
const DAY_MS = 24 * 60 * 60 * 1000;

/** 去掉 BOM、注释与尾逗号，容忍手写 JSON 的常见问题（字符串内的内容保持不变）。 */
function stripJsonNoise(text) {
  const source = String(text ?? '').replace(/^\uFEFF/, '');
  let out = '';
  let inString = false;
  let quote = '';
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (inString) {
      if (char === '\\') {
        out += char + (next ?? '');
        index += 1;
        continue;
      }
      if (char === quote) inString = false;
      // 字符串里的原始换行、制表符会让 JSON.parse 失败，转成转义序列
      if (char === '\n') out += '\\n';
      else if (char === '\r') out += '\\r';
      else if (char === '\t') out += '\\t';
      else out += char;
      continue;
    }
    if (char === '"') {
      inString = true;
      quote = char;
      out += char;
      continue;
    }
    if (char === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') index += 1;
      out += '\n';
      continue;
    }
    if (char === '/' && next === '*') {
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) index += 1;
      index += 1;
      continue;
    }
    out += char;
  }
  // 尾逗号：「, }」「, ]」
  return out.replace(/,(\s*[}\]])/g, '$1');
}

function hostName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

function cleanUrl(value, { keepTrailingSlash = false } = {}) {
  let url = String(value ?? '').trim();
  if (!/^https?:\/\//i.test(url)) return '';
  url = url.replace(/[?#]+$/, '');
  if (!keepTrailingSlash) url = url.replace(/\/+$/, '');
  try {
    const normalized = new URL(url).toString();
    return keepTrailingSlash ? normalized : normalized.replace(/\/$/, '');
  } catch {
    return '';
  }
}

function addSkip(stats, reason, sample) {
  stats.skipped += 1;
  stats.skippedByReason[reason] = (stats.skippedByReason[reason] || 0) + 1;
  if (sample && stats.skippedSamples.length < 5) stats.skippedSamples.push(sample);
}

/** TVBox 站点 → 可直接使用的 MacCMS 接口；爬虫类（type 3、jar/js/py、csp_）与不可搜索的站点跳过。 */
function tvBoxSite(site, stats) {
  const type = site?.type === undefined || site?.type === null ? '' : String(site.type).trim();
  const api = String(site?.api || '').trim();
  const name = String(site?.name || site?.key || '').trim();
  if (type === '3' || /^csp_/i.test(api) || /\.(?:jar|js|py)(?:[?#]|$)/i.test(api) || /^\.\//.test(api)) {
    addSkip(stats, '需要专用爬虫引擎', name);
    return null;
  }
  if (String(site?.searchable ?? '1') === '0') {
    addSkip(stats, '不支持搜索', name);
    return null;
  }
  const url = cleanUrl(api);
  const isCms = /\/provide\/vod/i.test(url) || type === '1';
  if (!url || !['', '0', '1', '4'].includes(type) || !isCms) {
    addSkip(stats, '接口格式不兼容', name);
    return null;
  }
  return { name: name || hostName(url), url };
}

function tvBoxLive(live, stats) {
  const type = live?.type === undefined || live?.type === null ? '0' : String(live.type).trim();
  const url = cleanUrl(live?.url || live?.api, { keepTrailingSlash: true });
  if (!url || type !== '0') {
    addSkip(stats, '直播格式不兼容', live?.name || '');
    return null;
  }
  if (/\.txt(?:[?#]|$)/i.test(url)) {
    addSkip(stats, 'TXT 直播列表暂不支持', live?.name || '');
    return null;
  }
  return { name: String(live?.name || hostName(url)), url, epg: cleanUrl(live?.epg, { keepTrailingSlash: true }) };
}

function dedupe(list, keyOf, limit, stats) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (!item) continue;
    const key = keyOf(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (out.length >= limit) {
      stats.truncated = true;
      continue;
    }
    out.push(item);
  }
  return out;
}

/**
 * 解析订阅内容，返回 { name, sources:[{name,url}], liveSources:[{name,url,epg}], stats }。
 * 支持：LibreTV-SourceList（{ name, sources, liveSources } 或直接是点播源数组）与 TVBox 配置（sites / lives）。
 */
function parseSubscription(text) {
  let json;
  try {
    json = JSON.parse(stripJsonNoise(text));
  } catch {
    throw new Error('订阅内容不是有效的 JSON（支持 LibreTV 源列表与 TVBox 配置）');
  }
  const stats = { format: '', accepted: 0, skipped: 0, skippedByReason: {}, skippedSamples: [], truncated: false };
  let name = '';
  let sources = [];
  let liveSources = [];
  if (Array.isArray(json)) {
    stats.format = 'libretv';
    sources = json;
  } else if (json && typeof json === 'object' && (Array.isArray(json.sites) || Array.isArray(json.lives))) {
    stats.format = 'tvbox';
    sources = (json.sites || []).map((site) => tvBoxSite(site, stats));
    liveSources = (json.lives || []).flatMap((live) => (Array.isArray(live?.channels) ? [] : [tvBoxLive(live, stats)]));
  } else if (json && typeof json === 'object' && (Array.isArray(json.sources) || Array.isArray(json.liveSources))) {
    stats.format = 'libretv';
    name = String(json.name || '').trim();
    sources = json.sources || [];
    liveSources = json.liveSources || [];
  } else {
    throw new Error('无法识别的订阅格式：需要 sources / liveSources 或 TVBox 的 sites / lives');
  }
  if (stats.format === 'libretv') {
    sources = sources.map((entry) => {
      const url = cleanUrl(entry?.url || entry?.api);
      if (!url) {
        addSkip(stats, '地址无效', entry?.name || '');
        return null;
      }
      return { name: String(entry?.name || hostName(url)).slice(0, 80), url };
    });
    liveSources = liveSources.map((entry) => {
      const url = cleanUrl(entry?.url, { keepTrailingSlash: true });
      if (!url) {
        addSkip(stats, '直播地址无效', entry?.name || '');
        return null;
      }
      return { name: String(entry?.name || hostName(url)).slice(0, 80), url, epg: cleanUrl(entry?.epg, { keepTrailingSlash: true }) };
    });
  }
  sources = dedupe(sources, (item) => item.url.replace(/^https?:/i, ''), MAX_VOD_SOURCES, stats);
  liveSources = dedupe(liveSources, (item) => item.url, MAX_LIVE_SOURCES, stats);
  stats.accepted = sources.length + liveSources.length;
  if (!stats.accepted) {
    const reason = Object.keys(stats.skippedByReason).join('、');
    throw new Error(`订阅里没有可直接使用的接口${reason ? `（已跳过：${reason}）` : ''}`);
  }
  return { name, sources, liveSources, stats };
}

/** 是否到了自动刷新时间。refreshDays 为 0 表示只手动刷新。 */
function isDue(subscription, now = Date.now()) {
  if (!subscription || subscription.enabled === false) return false;
  const days = Number(subscription.refreshDays ?? 1);
  if (!(days > 0)) return false;
  if (Number(subscription.failStreak || 0) >= AUTO_PAUSE_FAILS) return false;
  const last = Number(subscription.lastSync || 0);
  return !last || now - last >= days * DAY_MS;
}

function normalizeSubscriptionUrl(value) {
  const url = cleanUrl(value, { keepTrailingSlash: true });
  if (!url) throw new Error('请输入 http(s) 开头的订阅地址');
  return url;
}

/** 导出为 LibreTV-SourceList JSON。 */
function buildExport({ sources = [], liveSources = [] } = {}) {
  return {
    name: 'CineFlow 片源',
    exportedAt: new Date().toISOString(),
    sources: sources.map((source) => ({ name: source.name, url: source.api || source.url })),
    liveSources: liveSources.map((source) => ({ name: source.name, url: source.url, ...(source.epg ? { epg: source.epg } : {}) }))
  };
}

/**
 * 订阅服务。依赖：
 * - fetchText(url)：拉取订阅内容（带代理与超时）
 * - readSettings / writeSettings
 * - onSourcesChanged(settings)：订阅源变化后通知主进程刷新配置版本与缓存
 * - listExportSources()：当前全部启用的点播源
 */
function createSubscriptionService({ ipcMain, fetchText, readSettings, writeSettings, touchConfig, onSourcesChanged, listExportSources }) {
  const inflight = new Map();

  function listSubscriptions(settings = readSettings()) {
    const subscriptions = Array.isArray(settings.subscriptions) ? settings.subscriptions : [];
    const vod = Array.isArray(settings.subscriptionSources) ? settings.subscriptionSources : [];
    const live = Array.isArray(settings.subscriptionLiveSources) ? settings.subscriptionLiveSources : [];
    return subscriptions.map((subscription) => ({
      ...subscription,
      paused: Number(subscription.failStreak || 0) >= AUTO_PAUSE_FAILS,
      sourceCount: vod.filter((source) => source.subscription === subscription.url).length,
      liveCount: live.filter((source) => source.subscription === subscription.url).length
    }));
  }

  function save(mutator) {
    const settings = readSettings();
    mutator(settings);
    // 片源配置版本号变化后，渲染层与资源缓存会重新读取
    touchConfig?.(settings);
    writeSettings(settings);
    onSourcesChanged?.(settings);
    return settings;
  }

  async function sync(url, { manual = false } = {}) {
    if (inflight.has(url)) return inflight.get(url);
    const task = (async () => {
      const existing = listSubscriptions().find((item) => item.url === url);
      if (!existing) throw new Error('订阅不存在');
      try {
        const parsed = parseSubscription(await fetchText(url));
        save((settings) => {
          settings.subscriptionSources = [
            ...(settings.subscriptionSources || []).filter((source) => source.subscription !== url),
            ...parsed.sources.map((source, index) => ({ name: source.name, api: source.url, subscription: url, index }))
          ];
          settings.subscriptionLiveSources = [
            ...(settings.subscriptionLiveSources || []).filter((source) => source.subscription !== url),
            ...parsed.liveSources.map((source) => ({ ...source, subscription: url }))
          ];
          settings.subscriptions = (settings.subscriptions || []).map((item) => (item.url === url ? {
            ...item,
            name: item.name || parsed.name || hostName(url),
            lastSync: Date.now(),
            lastStatus: 'ok',
            lastError: '',
            failStreak: 0,
            lastCounts: { sources: parsed.sources.length, live: parsed.liveSources.length, skipped: parsed.stats.skipped, format: parsed.stats.format, skippedByReason: parsed.stats.skippedByReason }
          } : item));
        });
        return { ok: true, stats: parsed.stats, sources: parsed.sources.length, live: parsed.liveSources.length };
      } catch (error) {
        const message = String(error?.message || error).slice(0, 160);
        // 服务端临时不可用（401 / 503）不计入连续失败
        const transient = /\b(401|503)\b/.test(message);
        save((settings) => {
          settings.subscriptions = (settings.subscriptions || []).map((item) => (item.url === url ? {
            ...item,
            lastSync: manual ? item.lastSync : Date.now(),
            lastStatus: 'error',
            lastError: message,
            failStreak: transient ? Number(item.failStreak || 0) : Number(item.failStreak || 0) + 1
          } : item));
        });
        return { ok: false, error: message };
      }
    })().finally(() => inflight.delete(url));
    inflight.set(url, task);
    return task;
  }

  async function add(rawUrl, options = {}) {
    const url = normalizeSubscriptionUrl(rawUrl);
    save((settings) => {
      const list = Array.isArray(settings.subscriptions) ? settings.subscriptions : [];
      if (!list.some((item) => item.url === url)) {
        list.push({
          url,
          name: String(options.name || '').trim().slice(0, 60),
          refreshDays: Math.min(365, Math.max(0, Number(options.refreshDays ?? 1) || 0)),
          enabled: true,
          failStreak: 0,
          addedAt: Date.now()
        });
      }
      settings.subscriptions = list;
    });
    const result = await sync(url, { manual: true });
    return { ...result, subscriptions: listSubscriptions() };
  }

  function remove(url) {
    save((settings) => {
      settings.subscriptions = (settings.subscriptions || []).filter((item) => item.url !== url);
      settings.subscriptionSources = (settings.subscriptionSources || []).filter((source) => source.subscription !== url);
      settings.subscriptionLiveSources = (settings.subscriptionLiveSources || []).filter((source) => source.subscription !== url);
    });
    return listSubscriptions();
  }

  function update(url, patch = {}) {
    save((settings) => {
      settings.subscriptions = (settings.subscriptions || []).map((item) => {
        if (item.url !== url) return item;
        const next = { ...item };
        if (patch.name !== undefined) next.name = String(patch.name || '').trim().slice(0, 60);
        if (patch.refreshDays !== undefined) next.refreshDays = Math.min(365, Math.max(0, Number(patch.refreshDays) || 0));
        if (patch.enabled !== undefined) next.enabled = Boolean(patch.enabled);
        return next;
      });
    });
    return listSubscriptions();
  }

  /** 启动后静默刷新到期的订阅（最多 5 个，并发 2）。 */
  async function autoSync() {
    const due = listSubscriptions().filter((item) => isDue(item)).slice(0, AUTO_SYNC_LIMIT);
    let cursor = 0;
    const worker = async () => {
      while (cursor < due.length) {
        const item = due[cursor++];
        await sync(item.url).catch(() => {});
      }
    };
    await Promise.all(Array.from({ length: Math.min(AUTO_SYNC_CONCURRENCY, due.length) }, worker));
    return due.length;
  }

  function exportSources() {
    const settings = readSettings();
    const live = [
      ...(Array.isArray(settings.liveSources) ? settings.liveSources : []),
      ...(Array.isArray(settings.subscriptionLiveSources) ? settings.subscriptionLiveSources : [])
    ];
    return JSON.stringify(buildExport({ sources: listExportSources(), liveSources: live }), null, 2);
  }

  ipcMain.handle('subscriptions:list', async () => listSubscriptions());
  ipcMain.handle('subscriptions:add', async (_event, url, options) => add(url, options || {}));
  ipcMain.handle('subscriptions:remove', async (_event, url) => remove(String(url || '')));
  ipcMain.handle('subscriptions:update', async (_event, url, patch) => update(String(url || ''), patch || {}));
  ipcMain.handle('subscriptions:sync', async (_event, url) => {
    if (url) return { ...(await sync(String(url), { manual: true })), subscriptions: listSubscriptions() };
    const results = [];
    for (const item of listSubscriptions()) results.push(await sync(item.url, { manual: true }));
    return { ok: results.every((result) => result.ok), results, subscriptions: listSubscriptions() };
  });
  ipcMain.handle('sources:export', async () => exportSources());

  return { listSubscriptions, add, remove, update, sync, autoSync, exportSources };
}

module.exports = {
  stripJsonNoise,
  parseSubscription,
  isDue,
  buildExport,
  createSubscriptionService,
  AUTO_PAUSE_FAILS
};
