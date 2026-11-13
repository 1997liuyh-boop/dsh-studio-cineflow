// 片头 / 片尾跳过标记：按归一化片名保存在本机，同一作品的每一集共用。
// 片头记录「片头结束秒数」，片尾记录「距结尾的秒数」，因为每集时长可能略有差异。

import { normalizeTitle } from '../electron/vod-core.mjs';

export const SKIP_MARKS_KEY = 'cineflow:skip-marks:v1';
const MAX_ENTRIES = 300;
const MIN_SEGMENT = 3; // 少于 3 秒的标记视为误操作

function readAll(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(SKIP_MARKS_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(storage, marks) {
  const entries = Object.entries(marks).sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0)).slice(0, MAX_ENTRIES);
  try {
    storage.setItem(SKIP_MARKS_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // 存储不可用时只是记不住标记
  }
}

export function createSkipMarks(storage = globalThis.localStorage) {
  const keyOf = (title) => normalizeTitle(title);

  function get(title) {
    const key = keyOf(title);
    if (!key) return null;
    const mark = readAll(storage)[key];
    if (!mark) return null;
    return {
      introEnd: Number(mark.introEnd) || 0,
      outroLength: Number(mark.outroLength) || 0
    };
  }

  function update(title, patch) {
    const key = keyOf(title);
    if (!key) return null;
    const marks = readAll(storage);
    const next = { ...(marks[key] || {}), ...patch, updatedAt: Date.now() };
    if (!next.introEnd && !next.outroLength) delete marks[key];
    else marks[key] = next;
    writeAll(storage, marks);
    return get(title);
  }

  /** 把当前播放位置记为片头结束；位置过早或过晚（超过总时长一半）时拒绝。 */
  function markIntroEnd(title, currentTime, duration) {
    const time = Math.round(Number(currentTime) || 0);
    if (time < MIN_SEGMENT) return { ok: false, reason: '片头太短，请在片头结束处再标记' };
    if (duration > 0 && time > duration / 2) return { ok: false, reason: '当前位置超过一半时长，不像片头' };
    return { ok: true, mark: update(title, { introEnd: time }) };
  }

  /** 把当前播放位置记为片尾开始（保存为距结尾的秒数）。 */
  function markOutroStart(title, currentTime, duration) {
    const length = Math.round((Number(duration) || 0) - (Number(currentTime) || 0));
    if (!(duration > 0)) return { ok: false, reason: '时长未知，暂时不能标记片尾' };
    if (length < MIN_SEGMENT) return { ok: false, reason: '离结尾太近，请在片尾开始处再标记' };
    if (length > duration / 4) return { ok: false, reason: '片尾超过总时长四分之一，请检查位置' };
    return { ok: true, mark: update(title, { outroLength: length }) };
  }

  function clear(title) {
    return update(title, { introEnd: 0, outroLength: 0 });
  }

  return { get, markIntroEnd, markOutroStart, clear };
}

/**
 * 根据一次播放进度判断要执行的跳过动作。
 * state: { introDone, outroDone, lastTime }（每集重置）。
 * 返回 { action: 'intro', to } / { action: 'outro' } / null。
 * 片尾只在连续播放跨过片尾起点时触发（两次进度相差 0~10 秒），用户主动拖进片尾不会触发。
 */
export function decideSkip(mark, state, currentTime, duration) {
  if (!mark) return null;
  const time = Number(currentTime) || 0;
  const previous = Number(state.lastTime);
  state.lastTime = time;
  if (mark.introEnd > 0 && !state.introDone) {
    // 已经越过片头（例如续播直接跳到中段）就不再处理，之后用户主动拖回片头也不会被强制跳走
    state.introDone = true;
    if (time < mark.introEnd - 1 && (!(duration > 0) || mark.introEnd < duration - 2)) {
      return { action: 'intro', to: mark.introEnd, from: time };
    }
  }
  if (mark.outroLength > 0 && !state.outroDone && duration > 0) {
    const outroStart = duration - mark.outroLength;
    const crossed = Number.isFinite(previous) && previous < outroStart && time >= outroStart && time - previous <= 10;
    if (crossed && outroStart > (mark.introEnd || 0)) {
      state.outroDone = true;
      return { action: 'outro' };
    }
  }
  return null;
}
