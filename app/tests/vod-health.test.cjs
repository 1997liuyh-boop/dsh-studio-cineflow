// 片源健康度停用阶梯的单元测试
const test = require('node:test');
const assert = require('node:assert/strict');
const health = require('../electron/vod-health.cjs');

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

test('连续失败两次停用 30 分钟，成功后清除并降级', () => {
  let state = {};
  const now = 1_000_000;
  ({ health: state } = health.recordOutcomes(state, [{ key: 'a', ok: false, error: 'HTTP 500' }], now));
  assert.equal(state.a.failStreak, 1);
  assert.ok(!health.isDisabled(state.a, now));
  let events;
  ({ health: state, events } = health.recordOutcomes(state, [{ key: 'a', ok: false }], now));
  assert.deepEqual(events, [{ key: 'a', level: 1, permanent: false, ttlMs: 30 * MIN }]);
  assert.ok(health.isDisabled(state.a, now + 29 * MIN));
  assert.ok(!health.isDisabled(state.a, now + 31 * MIN));
  ({ health: state } = health.recordOutcomes(state, [{ key: 'a', ok: true, ms: 300 }], now + 40 * MIN));
  assert.equal(state.a.disableLevel, 0);
  assert.equal(state.a.failStreak, 0);
  assert.equal(health.describeHealth(state.a).status, 'ok');
});

test('停用到期后再失败两次升级到 24 小时，再升级为长期停用', () => {
  let state = {};
  let now = 0;
  const fail = () => { ({ health: state } = health.recordOutcomes(state, [{ key: 'a', ok: false }], now)); };
  fail(); fail();
  assert.equal(state.a.disableLevel, 1);
  now += 31 * MIN;
  fail();
  assert.equal(state.a.failStreak, 1, '到期后的第一次失败重新计数');
  fail();
  assert.equal(state.a.disableLevel, 2);
  assert.equal(state.a.disabledUntil, now + 24 * HOUR);
  now += 25 * HOUR;
  fail(); fail();
  assert.equal(state.a.permanent, true);
  assert.ok(health.isDisabled(state.a, now + 365 * 24 * HOUR));
  assert.equal(health.describeHealth(state.a).label, '已长期停用');
});

test('过期记录清理，长期停用不过期；手动恢复', () => {
  const now = 30 * 24 * HOUR;
  const pruned = health.pruneHealth({ a: { ok: true, at: 0 }, b: { permanent: true, at: 0 }, c: { ok: true, at: now } }, now);
  assert.deepEqual(Object.keys(pruned), ['b', 'c']);
  assert.deepEqual(Object.keys(health.resetHealth(pruned, 'b')), ['c']);
  assert.deepEqual(health.resetHealth(pruned), {});
});
