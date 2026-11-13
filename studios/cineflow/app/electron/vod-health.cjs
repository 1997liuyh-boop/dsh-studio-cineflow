// 片源健康度：根据每次搜索的成败自动停用连续失败的采集站，按阶梯延长停用时长。
// 规则设计参考 LibreTV-Next，代码为独立实现。

const FAIL_THRESHOLD = 2; // 连续失败多少次触发停用
const DISABLE_LADDER_MS = [30 * 60 * 1000, 24 * 60 * 60 * 1000]; // 第 1、2 级停用时长，第 3 级起长期停用
const RECORD_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 超过 7 天未更新的记录清理掉

/** 清理过期记录，返回新对象。 */
function pruneHealth(health = {}, now = Date.now()) {
  const next = {};
  for (const [key, entry] of Object.entries(health || {})) {
    if (!entry || typeof entry !== 'object') continue;
    // 长期停用的记录不过期，否则重启后会被悄悄恢复
    if (!entry.permanent && now - Number(entry.at || 0) > RECORD_TTL_MS) continue;
    next[key] = entry;
  }
  return next;
}

/** 当前是否处于停用状态（到期后惰性恢复，不需要定时器）。 */
function isDisabled(entry, now = Date.now()) {
  if (!entry) return false;
  return Boolean(entry.permanent) || Number(entry.disabledUntil || 0) > now;
}

/**
 * 记录一次搜索结果，返回 { health, events }。
 * outcome: { key, ok, ms, error, timedOut }
 * - 成功：清空连续失败与停用状态，停用等级下降一级；
 * - 失败：连续失败 +1（停用到期后的第一次失败从 1 重新计数），
 *   达到阈值且当前未停用时，按等级停用 30 分钟 → 24 小时 → 长期。
 */
function recordOutcomes(health = {}, outcomes = [], now = Date.now()) {
  const next = pruneHealth(health, now);
  const events = [];
  for (const outcome of outcomes) {
    const key = String(outcome?.key || '');
    if (!key) continue;
    const previous = next[key] || {};
    if (outcome.ok) {
      next[key] = {
        ok: true,
        ms: Number(outcome.ms) || 0,
        failStreak: 0,
        disableLevel: Math.max(0, Number(previous.disableLevel || 0) - 1),
        at: now
      };
      continue;
    }
    const expired = Number(previous.disabledUntil || 0) > 0 && Number(previous.disabledUntil) <= now && !previous.permanent;
    const failStreak = expired ? 1 : Number(previous.failStreak || 0) + 1;
    const entry = {
      ok: false,
      ms: Number(outcome.ms) || 0,
      error: String(outcome.error || '请求失败').slice(0, 120),
      timedOut: Boolean(outcome.timedOut),
      failStreak,
      disableLevel: Number(previous.disableLevel || 0),
      at: now
    };
    if (!expired && isDisabled(previous, now)) {
      // 仍在停用期内（例如手动指定搜索），保持原停用状态
      entry.disabledUntil = previous.disabledUntil;
      entry.permanent = previous.permanent;
    } else if (failStreak >= FAIL_THRESHOLD) {
      const level = entry.disableLevel + 1;
      const ttl = DISABLE_LADDER_MS[level - 1];
      entry.disableLevel = level;
      if (ttl) entry.disabledUntil = now + ttl;
      else entry.permanent = true;
      events.push({ key, level, permanent: !ttl, ttlMs: ttl || 0 });
    }
    next[key] = entry;
  }
  return { health: next, events };
}

/** 手动恢复：删除该源的健康记录；不传 key 时全部清空。 */
function resetHealth(health = {}, key) {
  if (!key) return {};
  const next = { ...health };
  delete next[key];
  return next;
}

/** 给界面展示用的状态摘要。 */
function describeHealth(entry, now = Date.now()) {
  if (!entry) return { status: 'unknown', label: '未检测' };
  if (entry.permanent) return { status: 'disabled', label: '已长期停用', permanent: true, error: entry.error || '' };
  if (Number(entry.disabledUntil || 0) > now) {
    return { status: 'disabled', label: '暂时停用', disabledUntil: entry.disabledUntil, error: entry.error || '' };
  }
  if (entry.ok) return { status: 'ok', label: '正常', ms: entry.ms || 0 };
  return { status: 'failing', label: `失败 ${entry.failStreak || 1} 次`, error: entry.error || '' };
}

module.exports = {
  FAIL_THRESHOLD,
  DISABLE_LADDER_MS,
  pruneHealth,
  isDisabled,
  recordOutcomes,
  resetHealth,
  describeHealth
};
