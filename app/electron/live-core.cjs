// 直播 IPTV 的纯函数：M3U 播放列表解析、XMLTV 节目单解析、当前 / 下一个节目查询。
// 功能设计参考 LibreTV-Next，代码为独立实现。

const crypto = require('node:crypto');

function shortHash(value) {
  return crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 12);
}

/** 读取 #EXTINF / #EXTM3U 行里的 key="value" 属性。 */
function parseAttributes(text) {
  const attributes = {};
  const re = /([\w-]+)\s*=\s*"([^"]*)"/g;
  let match;
  while ((match = re.exec(text))) attributes[match[1].toLowerCase()] = match[2].trim();
  return attributes;
}

/** 频道名：#EXTINF 中属性之后、第一个不在引号里的逗号后面的文字。 */
function channelNameOf(line) {
  let inQuote = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') inQuote = !inQuote;
    else if (char === ',' && !inQuote) return line.slice(index + 1).trim();
  }
  return '';
}

function resolveUrl(value, baseUrl) {
  // 空值不能按基准地址解析，否则会得到播放列表自身的地址
  if (!String(value ?? '').trim()) return '';
  try {
    const url = new URL(value, baseUrl || undefined);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

/**
 * 解析 M3U 播放列表。
 * 返回 { epgUrl, channels: [{ id, name, url, logo, group, tvgId, tvgName }] }，按地址去重，
 * 相对地址按播放列表地址解析，只保留 http(s)。
 */
function parseM3u(text, baseUrl = '') {
  const lines = String(text ?? '').replace(/^\uFEFF/, '').split(/\r?\n/);
  let epgUrl = '';
  let pending = null;
  let pendingGroup = '';
  const seen = new Set();
  const channels = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^#EXTM3U/i.test(line)) {
      const attributes = parseAttributes(line);
      epgUrl = (attributes['x-tvg-url'] || attributes['url-tvg'] || '').split(',')[0].trim();
      continue;
    }
    if (/^#EXTINF/i.test(line)) {
      const attributes = parseAttributes(line);
      pending = {
        name: channelNameOf(line) || attributes['tvg-name'] || '',
        logo: attributes['tvg-logo'] || '',
        group: attributes['group-title'] || '',
        tvgId: attributes['tvg-id'] || '',
        tvgName: attributes['tvg-name'] || ''
      };
      continue;
    }
    if (/^#EXTGRP:/i.test(line)) {
      pendingGroup = line.slice(8).trim();
      continue;
    }
    if (line.startsWith('#')) continue;
    const url = resolveUrl(line, baseUrl);
    const info = pending || { name: '', logo: '', group: '', tvgId: '', tvgName: '' };
    pending = null;
    const group = info.group || pendingGroup || '未分组';
    pendingGroup = '';
    if (!url || seen.has(url)) continue;
    seen.add(url);
    channels.push({
      id: info.tvgId ? `${info.tvgId}@${shortHash(url)}` : shortHash(url),
      name: info.name || info.tvgName || new URL(url).hostname,
      url,
      logo: resolveUrl(info.logo, baseUrl),
      group,
      tvgId: info.tvgId,
      tvgName: info.tvgName
    });
  }
  return { epgUrl: resolveUrl(epgUrl, baseUrl), channels };
}

/** XMLTV 时间「20261113203000 +0800」→ 毫秒；没有时区时按 UTC。 */
function parseXmltvTime(value) {
  const match = String(value ?? '').trim().match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\s*(?:([+-])(\d{2}):?(\d{2})|Z)?/);
  if (!match) return Number.NaN;
  const [, year, month, day, hour, minute, second = '00', sign, offsetHours, offsetMinutes] = match;
  const utc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  if (!sign) return utc;
  const offset = (Number(offsetHours) * 60 + Number(offsetMinutes)) * 60 * 1000;
  return sign === '+' ? utc - offset : utc + offset;
}

function decodeEntities(text) {
  return String(text ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
    .trim();
}

/** 频道名归一化：去掉空白、横线、点等分隔符并转小写，用于把播放列表频道与节目单频道对应起来。 */
function normalizeChannelName(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase().replace(/[\s\-_.·|()（）\[\]【】]+/g, '');
}

/**
 * 解析 XMLTV 节目单，只保留 [now - 1 小时, now + hours] 内的节目。
 * 返回 { names: Map(id → 显示名数组), programmes: Map(id → [{ start, stop, title }]) }。
 */
function parseXmltv(xml, { now = Date.now(), hours = 24 } = {}) {
  const text = String(xml ?? '');
  const names = new Map();
  const channelRe = /<channel\b[^>]*\bid\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/channel>/g;
  let match;
  while ((match = channelRe.exec(text))) {
    const id = decodeEntities(match[1]);
    const list = [];
    const nameRe = /<display-name\b[^>]*>([\s\S]*?)<\/display-name>/g;
    let nameMatch;
    while ((nameMatch = nameRe.exec(match[2]))) list.push(decodeEntities(nameMatch[1]));
    names.set(id, list);
  }
  const from = now - 60 * 60 * 1000;
  const to = now + hours * 60 * 60 * 1000;
  const programmes = new Map();
  const programmeRe = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/g;
  while ((match = programmeRe.exec(text))) {
    const attributes = parseAttributes(match[1]);
    const start = parseXmltvTime(attributes.start);
    const stop = parseXmltvTime(attributes.stop);
    if (!Number.isFinite(start) || !Number.isFinite(stop) || stop < from || start > to) continue;
    const title = decodeEntities(match[2].match(/<title\b[^>]*>([\s\S]*?)<\/title>/)?.[1] || '');
    const channel = decodeEntities(attributes.channel || '');
    if (!channel || !title) continue;
    if (!programmes.has(channel)) programmes.set(channel, []);
    programmes.get(channel).push({ start, stop, title });
  }
  for (const list of programmes.values()) list.sort((a, b) => a.start - b.start);
  return { names, programmes };
}

/** 当前正在播与下一个节目。 */
function currentAndNext(list = [], now = Date.now()) {
  const index = list.findIndex((item) => item.start <= now && item.stop > now);
  if (index >= 0) return { now: list[index], next: list[index + 1] || null };
  const upcoming = list.find((item) => item.start > now);
  return { now: null, next: upcoming || null };
}

/** 建立「节目单频道」索引：按 id 与归一化显示名查找。 */
function buildEpgIndex(epg) {
  const byName = new Map();
  for (const [id, list] of epg.names) {
    for (const name of [id, ...list]) {
      const key = normalizeChannelName(name);
      if (key && !byName.has(key)) byName.set(key, id);
    }
  }
  return {
    lookup(channel) {
      if (channel.tvgId && epg.programmes.has(channel.tvgId)) return channel.tvgId;
      for (const name of [channel.tvgId, channel.tvgName, channel.name]) {
        const id = byName.get(normalizeChannelName(name));
        if (id) return id;
      }
      return '';
    }
  };
}

module.exports = {
  parseAttributes,
  parseM3u,
  parseXmltvTime,
  parseXmltv,
  currentAndNext,
  normalizeChannelName,
  buildEpgIndex,
  decodeEntities
};
