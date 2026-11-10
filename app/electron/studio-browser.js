(() => {
  const token = new URLSearchParams(location.hash.slice(1)).get('bridge');
  const listeners = new Map();
  const headers = { authorization: 'Bearer ' + token };
  window.cineflowStudioBridge = {
    contextBridge: { exposeInMainWorld(name, value) { window[name] = value; } },
    ipcRenderer: {
      async invoke(channel, ...args) {
        if (channel.startsWith('window:')) return { mode: 'normal' };
        if (channel.startsWith('update:')) return { ok: false, error: '请通过 dsh 工作库升级影音插件' };
        const response = await fetch('/studio/rpc', { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ channel, args }) });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || '影音工作室连接失败');
        return body.result;
      },
      send() { /* 嵌入视图的窗口拖动由 dsh 负责。 */ },
      on(channel, callback) {
        if (!listeners.has(channel)) listeners.set(channel, new Set());
        listeners.get(channel).add(callback);
      },
      removeListener(channel, callback) { listeners.get(channel)?.delete(callback); }
    }
  };
  const controller = new AbortController();
  addEventListener('pagehide', () => controller.abort(), { once: true });
  async function events() {
    const response = await fetch('/studio/events', { headers, signal: controller.signal });
    if (!response.ok) throw new Error('影音事件连接失败');
    const reader = response.body.getReader();
    const decoder = new TextDecoder(); let buffer = '';
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let end;
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        const chunk = buffer.slice(0, end); buffer = buffer.slice(end + 2);
        if (!chunk.startsWith('data: ')) continue;
        const event = JSON.parse(chunk.slice(6));
        for (const callback of listeners.get(event.channel) || []) callback({}, event.payload);
      }
    }
  }
  void events().catch(error => { if (!controller.signal.aborted) console.error('影音工作室状态连接中断，请重新打开。'); });
  addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.window-controls, #islandRestoreBtn, #islandDockHandle').forEach(node => node.remove());
  }, { once: true });
})();
