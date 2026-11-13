// 采集站（MacCMS 接口）聚合搜索的纯函数：解析列表、相关性判断、季号识别、跨源聚合、播放地址拆分。
// 主进程与渲染层共用本模块；功能设计参考 LibreTV-Next，代码为独立实现。

const CHINESE_DIGITS = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

/** 片名归一化：统一全半角、转小写，去掉空白、标点与符号，用于比较与分组。 */
export function normalizeTitle(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

/** 把「12」「十二」「二十」这类数字转成整数，无法识别返回 NaN。 */
export function parseNumberToken(text) {
  const value = String(text ?? '').trim();
  if (/^\d+$/.test(value)) return Number(value);
  if (value === '十') return 10;
  const tens = value.match(/^([一二两三四五六七八九])?十([一二三四五六七八九])?$/);
  if (tens) return (tens[1] ? CHINESE_DIGITS[tens[1]] : 1) * 10 + (tens[2] ? CHINESE_DIGITS[tens[2]] : 0);
  if (value.length === 1 && value in CHINESE_DIGITS) return CHINESE_DIGITS[value];
  return Number.NaN;
}

/**
 * 拆出「基础片名 + 季号」。
 * - 「第N季 / 第N部」「Season N」两侧都识别；
 * - 查询侧允许尾部数字紧贴片名（庆余年2），片名侧尾部数字必须有空格隔开，
 *   避免把「蜘蛛侠3」「2046」这类本身就是片名的数字当成季号。
 * 没有季号时 season 为 0。
 */
export function splitSeason(title, { side = 'title' } = {}) {
  const raw = String(title ?? '').normalize('NFKC').trim();
  const explicit = raw.match(/^(.*?)[\s·:：\-—]*第\s*([0-9一二两三四五六七八九十]+)\s*[季部](.*)$/);
  if (explicit && explicit[1].trim()) {
    const season = parseNumberToken(explicit[2]);
    if (season > 0) return { base: explicit[1].trim(), season };
  }
  const english = raw.match(/^(.*?)[\s·:：\-—]*season\s*(\d{1,2})\b/i);
  if (english && english[1].trim()) return { base: english[1].trim(), season: Number(english[2]) };
  const trailing = side === 'query' ? raw.match(/^(.*?\D)\s*(\d{1,2})$/) : raw.match(/^(.*\S)\s+(\d{1,2})$/);
  if (trailing && normalizeTitle(trailing[1])) {
    const season = Number(trailing[2]);
    if (season > 0 && season < 40) return { base: trailing[1].trim(), season };
  }
  return { base: raw, season: 0 };
}

/** 在 haystack 中查找 needle，且数字开头/结尾的关键词不能与相邻数字粘连（「2」不匹配「12」）。 */
export function includesKeyword(haystack, needle) {
  if (!needle) return false;
  let from = 0;
  while (from <= haystack.length - needle.length) {
    const index = haystack.indexOf(needle, from);
    if (index < 0) return false;
    const before = haystack[index - 1] || '';
    const after = haystack[index + needle.length] || '';
    const startsWithDigit = /\d/.test(needle[0]);
    const endsWithDigit = /\d/.test(needle[needle.length - 1]);
    if (!(startsWithDigit && /\d/.test(before)) && !(endsWithDigit && /\d/.test(after))) return true;
    from = index + 1;
  }
  return false;
}

/** 预处理查询，避免对每条结果重复计算。 */
export function prepareQuery(query) {
  const raw = String(query ?? '').normalize('NFKC').trim();
  const { base, season } = splitSeason(raw, { side: 'query' });
  return {
    raw,
    normalized: normalizeTitle(raw),
    base: normalizeTitle(base),
    season,
    tokens: raw.split(/\s+/).map(normalizeTitle).filter(Boolean)
  };
}

/**
 * 判断一条结果的片名是否与查询相关。部分采集站做分词/模糊搜索，会返回大量无关结果，需要在本地再过滤。
 * - 查询与片名都带季号：季号必须相等，且基础片名相关；
 * - 否则：归一化后包含查询，或查询按空格分出的每个词都被包含，
 *   或者片名是查询的较长前缀（查询多带了「加长版」之类的后缀）。
 */
export function isRelevant(name, query) {
  const prepared = typeof query === 'object' && query && 'normalized' in query ? query : prepareQuery(query);
  if (!prepared.normalized) return false;
  const title = normalizeTitle(name);
  if (!title) return false;
  const titleSeason = splitSeason(name, { side: 'title' });
  if (prepared.season && titleSeason.season) {
    if (prepared.season !== titleSeason.season) return false;
    const titleBase = normalizeTitle(titleSeason.base);
    return includesKeyword(titleBase, prepared.base) || includesKeyword(title, prepared.base);
  }
  if (includesKeyword(title, prepared.normalized)) return true;
  if (prepared.tokens.length > 1 && prepared.tokens.every((token) => includesKeyword(title, token))) return true;
  return prepared.normalized.startsWith(title) && title.length >= 2 && title.length / prepared.normalized.length >= 0.6;
}

const NOISE_RE = /(解说|预告|花絮|短评|速看|看点|幕后|特辑|reaction|剪辑|混剪|片段)/i;

/** 解说、预告、花絮类条目：不删除，在界面上折叠显示。 */
export function isNoise(item) {
  return NOISE_RE.test(`${item?.name || ''} ${item?.typeName || ''}`);
}

const ADULT_TYPE_RE = /(伦理|倫理|福利|写真|寫真|里番|成人|情色|三级|三級|无码|無碼|有码|有碼|自拍|偷拍|av|av女优|美女|激情|丝袜|絲襪|制服|色情)/i;

/** 按分类名过滤成人内容。 */
export function isAdult(item) {
  return ADULT_TYPE_RE.test(String(item?.typeName || ''));
}

function cleanText(value, limit = 200) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function cleanImage(value) {
  const url = String(value ?? '').trim();
  return /^https?:\/\//i.test(url) ? url : '';
}

/** 把采集站返回的 vod_* 列表映射为统一的搜索结果条目。 */
export function parseCmsList(payload, source = {}) {
  const list = Array.isArray(payload?.list) ? payload.list : [];
  return list
    .filter((item) => item && (item.vod_id !== undefined && item.vod_id !== null) && item.vod_name)
    .map((item) => ({
      sourceKey: String(source.key || ''),
      sourceName: String(source.name || ''),
      vodId: String(item.vod_id),
      name: cleanText(item.vod_name, 120),
      pic: cleanImage(item.vod_pic),
      typeName: cleanText(item.type_name, 40),
      year: String(item.vod_year || '').match(/\d{4}/)?.[0] || '',
      area: cleanText(item.vod_area, 40),
      remarks: cleanText(item.vod_remarks || item.vod_pubdate, 60),
      updatedAt: cleanText(item.vod_time, 30)
    }));
}

/** 读取第一页的总页数，缺失或非法时视为 1 页。 */
export function readPageCount(payload) {
  const value = Number.parseInt(String(payload?.pagecount ?? '1'), 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/** 单源结果过滤：相关性 + 成人内容 + 源内去重。 */
export function filterSearchItems(items, query, { filterAdult = true } = {}) {
  const prepared = prepareQuery(query);
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.sourceKey}_${item.vodId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (filterAdult && isAdult(item)) return false;
    return isRelevant(item.name, prepared);
  });
}

function mostCommon(values) {
  const counts = new Map();
  for (const value of values) if (value) counts.set(value, (counts.get(value) || 0) + 1);
  let best = '';
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function buildGroup(key, items, query) {
  const sources = new Set(items.map((item) => item.sourceKey));
  const name = mostCommon(items.map((item) => item.name)) || items[0]?.name || '';
  const normalized = normalizeTitle(name);
  const first = (field) => items.find((item) => item[field])?.[field] || '';
  return {
    key,
    name,
    year: mostCommon(items.map((item) => item.year)),
    typeName: mostCommon(items.map((item) => item.typeName)),
    area: first('area'),
    pic: first('pic'),
    remarks: mostCommon(items.map((item) => item.remarks)),
    sourceCount: sources.size,
    exact: Boolean(query.normalized) && normalized === query.normalized,
    prefix: Boolean(query.normalized) && normalized.startsWith(query.normalized),
    noise: items.every(isNoise),
    items
  };
}

/**
 * 跨源聚合：同名（归一化后）合并为一组；同名但年份不同的拆成多组，
 * 没有年份的条目在只有一个年份时并入该组，否则单独成组。
 * 排序：精确命中 → 正片优先于解说 → 以查询开头 → 来源多 → 片名。
 */
export function aggregateResults(items, query) {
  const prepared = typeof query === 'object' && query && 'normalized' in query ? query : prepareQuery(query);
  const buckets = new Map();
  for (const item of items) {
    const key = normalizeTitle(item.name);
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  }
  const groups = [];
  for (const [key, bucket] of buckets) {
    const years = [...new Set(bucket.map((item) => item.year).filter(Boolean))];
    if (years.length <= 1) {
      groups.push(buildGroup(`${key}|${years[0] || ''}`, bucket, prepared));
      continue;
    }
    for (const year of years) {
      groups.push(buildGroup(`${key}|${year}`, bucket.filter((item) => item.year === year), prepared));
    }
    const yearless = bucket.filter((item) => !item.year);
    if (yearless.length) groups.push(buildGroup(`${key}|`, yearless, prepared));
  }
  return groups.sort((a, b) =>
    Number(b.exact) - Number(a.exact)
    || Number(a.noise) - Number(b.noise)
    || Number(b.prefix) - Number(a.prefix)
    || b.sourceCount - a.sourceCount
    || a.name.localeCompare(b.name, 'zh-Hans-CN')
    || String(b.year).localeCompare(String(a.year))
  );
}

const MAX_PLAY_GROUPS = 16;
const MAX_EPISODES = 3000;

/**
 * 拆分播放地址：线路用 $$$ 分隔，剧集用 # 分隔，每集「名称$地址」。
 * 只保留 http(s) 地址；直链 m3u8 线路排在网页播放线路之前；保留剧集名。
 */
export function splitPlayGroups(item = {}) {
  const fromGroups = String(item.vod_play_from || '').split('$$$');
  const urlGroups = String(item.vod_play_url || '').split('$$$');
  const groups = [];
  urlGroups.forEach((group, groupIndex) => {
    const episodes = [];
    String(group || '').split('#').forEach((segment) => {
      const clean = segment.trim();
      if (!clean) return;
      const dollar = clean.lastIndexOf('$');
      const label = dollar > 0 ? clean.slice(0, dollar).trim() : '';
      const url = (dollar >= 0 ? clean.slice(dollar + 1) : clean).trim();
      if (!/^https?:\/\//i.test(url)) return;
      if (episodes.length >= MAX_EPISODES) return;
      episodes.push({ label: label || `第${episodes.length + 1}集`, url });
    });
    if (!episodes.length) return;
    const name = String(fromGroups[groupIndex] || fromGroups[0] || '').trim() || `线路 ${groupIndex + 1}`;
    const m3u8 = episodes.filter((episode) => /\.m3u8(?:$|[?#])/i.test(episode.url)).length;
    groups.push({ name, episodes, directRatio: m3u8 / episodes.length, order: groupIndex });
  });
  return groups
    .sort((a, b) => (b.directRatio >= 0.5) - (a.directRatio >= 0.5) || a.order - b.order)
    .slice(0, MAX_PLAY_GROUPS)
    .map(({ name, episodes }) => ({ name, episodes }));
}

/** 详情条目的元数据（简介去掉 HTML 标签）。 */
export function parseDetailMeta(item = {}, source = {}) {
  return {
    sourceKey: String(source.key || ''),
    sourceName: String(source.name || ''),
    vodId: String(item.vod_id ?? ''),
    name: cleanText(item.vod_name, 120),
    pic: cleanImage(item.vod_pic),
    typeName: cleanText(item.type_name, 40),
    year: String(item.vod_year || '').match(/\d{4}/)?.[0] || '',
    area: cleanText(item.vod_area, 60),
    lang: cleanText(item.vod_lang, 40),
    remarks: cleanText(item.vod_remarks, 60),
    director: cleanText(item.vod_director, 120),
    actor: cleanText(item.vod_actor, 300),
    content: cleanText(item.vod_content || item.vod_blurb, 1200)
  };
}
