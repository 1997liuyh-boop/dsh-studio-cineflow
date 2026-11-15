// 播放器快捷键：播放器打开期间，空格暂停 / 继续，左右方向键后退 / 快进。
// ArtPlayer 自带的快捷键只在点过播放器本身之后才生效（它的 isFocus），刚打开、或点了选集 / 换源等按钮后按键没反应；
// 这里在整页监听，只要播放器开着就生效。点过播放器时仍交给 ArtPlayer 自己处理，避免同一次按键执行两遍。

/** 方向键每次快进 / 后退的秒数（与 ArtPlayer 默认的 SEEK_STEP 一致）。 */
export const SEEK_SECONDS = 5;

/** 正在输入文字的元素：快捷键让给输入。 */
function isEditable(target) {
  if (!target || typeof target !== 'object') return false;
  const tag = String(target.tagName || '').toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = String(target.type || 'text').toLowerCase();
    return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'image', 'color', 'file'].includes(type);
  }
  return Boolean(target.isContentEditable);
}

/**
 * 判断一次按键对应的播放器操作。
 * @param {{ key: string, code?: string, ctrlKey?: boolean, altKey?: boolean, metaKey?: boolean, shiftKey?: boolean, defaultPrevented?: boolean, target?: any }} event 按键事件。
 * @param {{ open: boolean, live?: boolean, artFocused?: boolean }} context open：播放器是否打开；live：是否直播（不能快进后退）；artFocused：ArtPlayer 是否已自己接管快捷键。
 * @returns {'toggle' | 'backward' | 'forward' | null}
 */
export function playerHotkey(event, context) {
  if (!context?.open || context.artFocused || event.defaultPrevented) return null;
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return null;
  if (isEditable(event.target)) return null;
  if (event.key === ' ' || event.code === 'Space') return 'toggle';
  if (context.live) return null;
  if (event.key === 'ArrowLeft') return 'backward';
  if (event.key === 'ArrowRight') return 'forward';
  return null;
}

/**
 * 在整页安装播放器快捷键。
 * @param {object} art ArtPlayer 实例。
 * @param {() => { open?: boolean, live?: boolean }} player 读取当前播放状态。
 * @returns {() => void} 卸载函数。
 */
export function installPlayerHotkeys(art, player) {
  const onKeydown = (event) => {
    const current = player() || {};
    const action = playerHotkey(event, { open: Boolean(current.open), live: Boolean(current.live), artFocused: Boolean(art.isFocus) });
    if (!action) return;
    // 阻止默认行为：空格不再触发当前聚焦的按钮（例如刚点过的「下一集」），方向键不滚动页面
    event.preventDefault();
    if (action === 'toggle') art.toggle();
    else if (action === 'backward') art.backward = SEEK_SECONDS;
    else art.forward = SEEK_SECONDS;
  };
  document.addEventListener('keydown', onKeydown);
  return () => document.removeEventListener('keydown', onKeydown);
}
