// Strong m3u8 ad filter for the renderer-side hls.js path (direct transport).
// Mirrors electron/ad-filter.cjs; pure string pass wrapped in try/catch, never breaks playback.

const AD_HINT_RE = /SCTE35|X-SCTE|CUE-OUT|CUE-IN|-AD[-="]|ID=("?)ad/i;

function isUriLine(line) {
  const trimmed = line.trim();
  return Boolean(trimmed) && !trimmed.startsWith('#');
}

function parseDuration(tagLines) {
  for (const tag of tagLines) {
    const match = /^#EXTINF:\s*([\d.]+)/i.exec(tag.trim());
    if (match) return Number(match[1]) || 0;
  }
  return 0;
}

function hasDiscontinuity(tagLines) {
  return tagLines.some((tag) => /^#EXT-X-DISCONTINUITY\b/i.test(tag.trim()));
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// 分片地址的目录（去掉文件名与查询串），用于判断插入的分组是否来自另一套地址
function segmentDirectory(uri) {
  const clean = String(uri || '').trim().split(/[?#]/)[0];
  const index = clean.lastIndexOf('/');
  return index >= 0 ? clean.slice(0, index) : '';
}

const AD_URI_RE = /adjump|advert|guanggao|\/ads?\//i;

// v0.3.0 增强：按 DISCONTINUITY 分组后识别插入的广告组。
// - 只处理点播清单（有 #EXT-X-ENDLIST），直播清单不做分组判定，避免误删直播内容；
// - 分片地址全部带广告特征的分组直接删除；
// - 编码器分段（4 组以上且各组时长接近）时只删除明显短于中位数、且地址目录不同的分组；
// - 其它情况沿用原规则：时长不超过 120 秒、不超过主分组三分之一、不超过 12 个分片。
function groupAdBurstFilter(parsed) {
  const { head, segments, tail } = parsed;
  if (segments.length < 2) return { head, segments, tail, dropped: 0 };
  if (!parsed.tail.some((line) => /^#EXT-X-ENDLIST/i.test(line.trim()))) return { head, segments, tail, dropped: 0 };

  const groups = [];
  let current = null;
  for (const segment of segments) {
    if (!current || hasDiscontinuity(segment.tags)) {
      current = { segments: [], duration: 0 };
      groups.push(current);
    }
    current.segments.push(segment);
    current.duration += segment.duration;
  }
  if (groups.length < 2) return { head, segments, tail, dropped: 0 };

  // 主分组从「分片地址不带广告特征」的分组里选，避免很长的广告组被当成正片
  for (const group of groups) group.adUris = group.segments.every((segment) => AD_URI_RE.test(segment.uri));
  const candidates = groups.some((group) => !group.adUris) ? groups.filter((group) => !group.adUris) : groups;
  let main = candidates[0];
  for (const group of candidates) {
    if (group.duration > main.duration) main = group;
  }
  if (main.duration <= 0) return { head, segments, tail, dropped: 0 };

  const mainDirectory = segmentDirectory(main.segments[0]?.uri);
  const others = groups.filter((group) => group !== main);
  const chunked = groups.length >= 4 && median(others.map((group) => group.duration)) >= 60;
  const typical = median(others.map((group) => group.duration));

  const kept = [];
  let dropped = 0;
  for (const group of groups) {
    let isAdGroup = false;
    if (group !== main) {
      const adUris = group.adUris;
      const foreign = Boolean(mainDirectory) && group.segments.every((segment) => segmentDirectory(segment.uri) !== mainDirectory);
      if (adUris) {
        isAdGroup = true;
      } else if (chunked) {
        isAdGroup = foreign && group.duration <= 60 && group.duration < typical * 0.25;
      } else {
        isAdGroup = group.duration <= 120 && group.duration * 3 <= main.duration && group.segments.length <= 12;
      }
    }
    if (isAdGroup) {
      dropped += group.segments.length;
      continue;
    }
    for (const segment of group.segments) kept.push(segment);
  }
  return { head, segments: kept, tail, dropped };
}

function parseMediaPlaylist(lines) {
  const head = [];
  const segments = [];
  const tail = [];
  let pendingTags = [];
  let mode = 'head';

  for (const line of lines) {
    const trimmed = line.trim();
    if (mode !== 'tail' && isUriLine(line)) {
      mode = 'body';
      segments.push({ tags: pendingTags, uri: line, duration: parseDuration(pendingTags) });
      pendingTags = [];
      continue;
    }
    if (trimmed.startsWith('#EXT-X-ENDLIST')) {
      mode = 'tail';
      tail.push(line);
      continue;
    }
    if (mode === 'head') head.push(line);
    else if (mode === 'tail') tail.push(line);
    else pendingTags.push(line);
  }
  return { head, segments, tail, pendingTags };
}

function rebuildPlaylist(parsed, pendingTags) {
  const out = [];
  for (const line of parsed.head) {
    if (/^#EXT-X-DISCONTINUITY(-SEQUENCE)?\b/i.test(line.trim())) continue;
    out.push(line);
  }
  for (const segment of parsed.segments) {
    for (const tag of segment.tags) {
      const trimmed = tag.trim();
      if (/^#EXT-X-DISCONTINUITY\b/i.test(trimmed)) continue;
      if (/^#EXT-X-(CUE-OUT|CUE-IN|AS-SCTE35)/i.test(trimmed)) continue;
      if (/^#EXT-X-DATERANGE/i.test(trimmed) && AD_HINT_RE.test(trimmed)) continue;
      out.push(tag);
    }
    out.push(segment.uri);
  }
  for (const tag of pendingTags) out.push(tag);
  for (const line of parsed.tail) out.push(line);
  return out.join('\n');
}

export function filterAdsFromM3u8(content) {
  if (typeof content !== 'string' || !content) return content || '';
  let work = content;

  try {
    if (/#EXT-X-CUE-OUT/i.test(work) && /#EXT-X-CUE-IN/i.test(work)) {
      const lines = work.split(/\r?\n/);
      const out = [];
      let inAd = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (/^#EXT-X-CUE-OUT/i.test(trimmed)) { inAd = true; continue; }
        if (/^#EXT-X-CUE-IN/i.test(trimmed)) { inAd = false; continue; }
        if (inAd && (isUriLine(line) || /^#EXT-X-(?:DISCONTINUITY|MAP|KEY|PROGRAM-DATE-TIME|DATERANGE)/i.test(trimmed))) continue;
        out.push(line);
      }
      work = out.join('\n');
    }

    if (/#EXT-X-DISCONTINUITY\b/i.test(work) && /#EXTINF/i.test(work)) {
      const parsed = parseMediaPlaylist(work.split(/\r?\n/));
      if (!parsed.head.some((line) => /#EXT-X-STREAM-INF/i.test(line))) {
        const filtered = groupAdBurstFilter(parsed);
        if (filtered.dropped > 0 && filtered.segments.length > 0) {
          work = rebuildPlaylist(filtered, parsed.pendingTags);
        }
      }
    }

    if (/#EXT-X-DISCONTINUITY(-SEQUENCE)?\b|^#EXT-X-(CUE-OUT|CUE-IN|AS-SCTE35)/im.test(work)) {
      work = work
        .split(/\r?\n/)
        .filter((line) => {
          const trimmed = line.trim();
          if (/^#EXT-X-DISCONTINUITY(-SEQUENCE)?\b/i.test(trimmed)) return false;
          if (/^#EXT-X-(CUE-OUT|CUE-IN|AS-SCTE35)/i.test(trimmed)) return false;
          if (/^#EXT-X-DATERANGE/i.test(trimmed) && AD_HINT_RE.test(trimmed)) return false;
          return true;
        })
        .join('\n');
    }
  } catch {
    return content;
  }

  if (!/#EXTM3U/i.test(work) || work.trim() === '') return content;
  return work;
}

export function looksLikeManifestWithAdMarks(text) {
  return typeof text === 'string'
    && /#EXT-X-(DISCONTINUITY|CUE-OUT|CUE-IN|AS-SCTE35)/i.test(text);
}

export function createAdFilteringLoader(Hls) {
  const BaseLoader = Hls?.DefaultConfig?.pLoader || Hls?.DefaultConfig?.loader;
  if (!BaseLoader || typeof BaseLoader !== 'function') return null;

  return class AdFilteringPlaylistLoader extends BaseLoader {
    // eslint-disable-next-line no-useless-constructor
    constructor(config) {
      super(config);
      const originalLoad = this.load.bind(this);
      this.load = function adFilterLoad(context, config2, callbacks) {
        if (context && (context.type === 'manifest' || context.type === 'level') && callbacks) {
          const originalOnSuccess = callbacks.onSuccess;
          callbacks.onSuccess = function adFilterOnSuccess(response, stats, ctx, networkDetails) {
            try {
              if (response && typeof response.data === 'string' && looksLikeManifestWithAdMarks(response.data)) {
                response.data = filterAdsFromM3u8(response.data);
              }
            } catch {
              // keep the untouched manifest on any filter error
            }
            return originalOnSuccess(response, stats, ctx, networkDetails);
          };
        }
        return originalLoad(context, config2, callbacks);
      };
    }
  };
}
