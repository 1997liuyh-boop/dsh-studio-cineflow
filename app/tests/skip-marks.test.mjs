// 片头片尾标记与跳过判定的单元测试
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSkipMarks, decideSkip } from '../src/skip-marks.js';

function memoryStorage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)) };
}

test('标记按归一化片名保存，同一作品共用', () => {
  const marks = createSkipMarks(memoryStorage());
  assert.equal(marks.markIntroEnd('JOJO的奇妙冒险 石之海', 92, 1450).ok, true);
  assert.equal(marks.markOutroStart('JOJO的奇妙冒险：石之海', 1360, 1450).ok, true);
  assert.deepEqual(marks.get('jojo的奇妙冒险石之海'), { introEnd: 92, outroLength: 90 });
  assert.equal(marks.markIntroEnd('x', 1, 100).ok, false);
  assert.equal(marks.markIntroEnd('x', 800, 1000).ok, false);
  assert.equal(marks.markOutroStart('x', 500, 1000).ok, false);
  marks.clear('JOJO的奇妙冒险 石之海');
  assert.equal(marks.get('JOJO的奇妙冒险 石之海'), null);
});

test('片头只在开头跳一次，越过后拖回不再跳', () => {
  const mark = { introEnd: 90, outroLength: 0 };
  const state = { introDone: false, outroDone: false, lastTime: Number.NaN };
  assert.deepEqual(decideSkip(mark, state, 0.5, 1400), { action: 'intro', to: 90, from: 0.5 });
  assert.equal(decideSkip(mark, state, 10, 1400), null);
  const resumed = { introDone: false, outroDone: false, lastTime: Number.NaN };
  assert.equal(decideSkip(mark, resumed, 600, 1400), null, '续播到中段不跳片头');
  assert.equal(decideSkip(mark, resumed, 5, 1400), null);
});

test('片尾只在连续播放跨过时触发，拖进片尾不触发', () => {
  const mark = { introEnd: 0, outroLength: 90 };
  const state = { introDone: false, outroDone: false, lastTime: Number.NaN };
  decideSkip(mark, state, 1305, 1400);
  assert.deepEqual(decideSkip(mark, state, 1311, 1400), { action: 'outro' });
  const seeking = { introDone: false, outroDone: false, lastTime: Number.NaN };
  decideSkip(mark, seeking, 600, 1400);
  assert.equal(decideSkip(mark, seeking, 1330, 1400), null);
});
