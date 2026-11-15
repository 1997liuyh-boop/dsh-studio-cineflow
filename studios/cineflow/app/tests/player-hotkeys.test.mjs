// 播放器快捷键：空格暂停 / 继续，左右方向键后退 / 快进
import test from 'node:test';
import assert from 'node:assert/strict';
import { SEEK_SECONDS, installPlayerHotkeys, playerHotkey } from '../src/player-hotkeys.js';

const key = (value, extra = {}) => ({ key: value, code: value === ' ' ? 'Space' : value, target: { tagName: 'BODY' }, ...extra });
const open = { open: true };

test('播放器打开时：空格切换播放，左右方向键后退 / 快进', () => {
  assert.equal(playerHotkey(key(' '), open), 'toggle');
  assert.equal(playerHotkey(key('ArrowLeft'), open), 'backward');
  assert.equal(playerHotkey(key('ArrowRight'), open), 'forward');
  assert.equal(playerHotkey(key('ArrowUp'), open), null, '音量键仍交给 ArtPlayer');
});

test('焦点在按钮上（例如刚点过「下一集」）时空格也是暂停，而不是再点一次按钮', () => {
  assert.equal(playerHotkey(key(' ', { target: { tagName: 'BUTTON' } }), open), 'toggle');
});

test('不处理：播放器关着、在输入框里打字、带修饰键、ArtPlayer 已接管、事件已被处理', () => {
  assert.equal(playerHotkey(key(' '), { open: false }), null);
  assert.equal(playerHotkey(key(' ', { target: { tagName: 'INPUT', type: 'search' } }), open), null);
  assert.equal(playerHotkey(key('ArrowLeft', { target: { tagName: 'TEXTAREA' } }), open), null);
  assert.equal(playerHotkey(key('ArrowLeft', { target: { tagName: 'DIV', isContentEditable: true } }), open), null);
  assert.equal(playerHotkey(key(' ', { target: { tagName: 'INPUT', type: 'checkbox' } }), open), 'toggle', '勾选框不是文字输入');
  assert.equal(playerHotkey(key('ArrowRight', { ctrlKey: true }), open), null);
  assert.equal(playerHotkey(key(' '), { open: true, artFocused: true }), null, '点过播放器时由 ArtPlayer 自己处理，避免执行两遍');
  assert.equal(playerHotkey(key(' ', { defaultPrevented: true }), open), null);
});

test('直播只能暂停，不能快进后退', () => {
  assert.equal(playerHotkey(key(' '), { open: true, live: true }), 'toggle');
  assert.equal(playerHotkey(key('ArrowRight'), { open: true, live: true }), null);
});

test('安装后在整页生效：调用 ArtPlayer 的切换与快进后退，并阻止默认行为；卸载后不再响应', () => {
  const listeners = new Map();
  globalThis.document = {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); },
  };
  const calls = [];
  const art = { isFocus: false, toggle: () => calls.push('toggle'), set forward(value) { calls.push('forward ' + value); }, set backward(value) { calls.push('backward ' + value); } };
  const uninstall = installPlayerHotkeys(art, () => ({ open: true }));
  let prevented = 0;
  for (const value of [' ', 'ArrowRight', 'ArrowLeft']) listeners.get('keydown')(key(value, { preventDefault: () => { prevented += 1; } }));
  assert.deepEqual(calls, ['toggle', 'forward ' + SEEK_SECONDS, 'backward ' + SEEK_SECONDS]);
  assert.equal(prevented, 3);
  uninstall();
  assert.equal(listeners.has('keydown'), false);
  delete globalThis.document;
});
