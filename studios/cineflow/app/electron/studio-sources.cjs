const catalog = require('../studio-source-catalog.json');
const { parseResourcePayload } = require('./studio-resource-payload.cjs');

function canonicalApi(raw) {
  try {
    const url = new URL(raw);
    url.searchParams.delete('ac');
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.href.replace(/\?$/, '');
  } catch { return ''; }
}

/** 协议与 CMS 输出格式不改变片库身份，线路和认证参数仍需独立保留。 */
function resourceIdentity(raw) {
  try {
    const url = new URL(canonicalApi(raw));
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    url.pathname = url.pathname.replace(/(\/provide\/vod)\/at\/(?:xml|xm|json)(?=\/|$)/i, '$1');
    url.searchParams.sort();
    return `${url.username}:${url.password}@${url.host}${url.pathname}${url.search}`;
  } catch { return ''; }
}

function deduplicateResourceSources(entries) {
  const seen = new Set();
  return entries.filter(source => {
    const key = resourceIdentity(source?.api || source?.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 提供商相同的镜像只合并展示，不丢弃实际播放线路。 */
function resourceProvider(source) {
  const name = String(source.name || '').trim().replace(/資/g, '资').replace(/閃/g, '闪').replace(/電/g, '电').replace(/紅/g, '红');
  return { key: name || resourceIdentity(source.api), name: name || '未命名源' };
}

/** 仅接收当前播放器能够直接读取的 CMS JSON/XML，不执行外部爬虫。 */
function tvBoxSiteToSourceEntry(site) {
  const type = site?.type === undefined ? '' : String(site.type).trim();
  const api = String(site?.api || '').trim();
  if (!['', '0', '1'].includes(type) || !/^https?:\/\//i.test(api) || /\.(?:js|jar)(?:[?#]|$)/i.test(api)) return null;
  return { name: site.name || site.key || '', api: canonicalApi(api), note: type === '0' ? 'TVBox XML 采集接口' : 'TVBox JSON 采集接口' };
}

function resourceVerification(api) {
  return catalog.sources.find(source => canonicalApi(source.api) === canonicalApi(api))?.verification || null;
}

function resourceProbe(api) {
  return catalog.probes.find(source => canonicalApi(source.url) === canonicalApi(api)) || null;
}

/** 升级时补齐旧版遗漏的种子；迁移完成后尊重用户的删除和清空操作。 */
function migrateStudioResourceSources(settings, normalize, seeds = require('../studio-sources.json').sources) {
  const version = Number(settings.studioSourceSeedVersion || 0);
  if (version >= 3) return false;
  const current = Array.isArray(settings.customResourceSources) ? [...settings.customResourceSources] : [];
  const seen = new Set(current.map(source => resourceIdentity(source?.api || source?.url)));
  for (const [index, seed] of (version < 2 ? seeds : []).entries()) {
    const source = normalize({ ...seed, key: seed.id }, index, 'custom');
    const api = resourceIdentity(source?.api);
    if (!api || seen.has(api)) continue;
    seen.add(api);
    current.push(source);
  }
  settings.customResourceSources = deduplicateResourceSources(current);
  settings.studioSourceSeedVersion = 3;
  return true;
}

function validateResourcePayload(text) {
  let payload;
  try { payload = parseResourcePayload(text); }
  catch { throw new Error('未返回有效采集数据，可能是网页、验证页或接口格式不兼容'); }
  if (!payload || !Array.isArray(payload.list)) throw new Error('响应缺少影片列表，不能作为采集接口');
  return payload;
}

/** 网页检测只说明页面能否访问，不宣称影片能够直连播放。 */
async function testWebsite(fetch, raw) {
  const site = catalog.websites.find(item => item.url === String(raw || ''));
  if (!site) return { ok: false, state: 'unknown', error: '自定义网站请通过原站检查，内置站点支持在线检测' };
  const started = Date.now();
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(site.url, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Buffer.from(value)); size += value.length;
        if (size > 2 * 1024 * 1024) break;
      }
    } finally { await reader.cancel().catch(() => {}); }
    const text = Buffer.concat(chunks).toString('utf8');
    const challenge = /Just a moment|Checking your browser|Attention Required!|cf-chl-|安全验证|人机验证/i.test(text);
    const parked = /domain is for sale|域名出售|域名停靠|网站已关闭|This domain is parked/i.test(text);
    const html = /<!doctype html|<html[\s>]/i.test(text);
    const state = challenge ? 'challenge' : parked ? 'parked' : response.ok && html ? 'page' : 'unavailable';
    return { ok: state === 'page', state, status: response.status, elapsedMs: Date.now() - started, checkedAt };
  } catch { return { ok: false, state: 'unavailable', elapsedMs: Date.now() - started, checkedAt, error: '当前网络连接失败或超时' }; }
}

module.exports = { catalog, canonicalApi, resourceIdentity, deduplicateResourceSources, resourceProvider, tvBoxSiteToSourceEntry, resourceVerification, resourceProbe, migrateStudioResourceSources, validateResourcePayload, testWebsite };
