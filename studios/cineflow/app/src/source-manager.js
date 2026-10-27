// 片源设置只使用主进程的同一份清单；提供商分组仅影响展示，保留不同播放线路。
const TEST_CONCURRENCY = 2;

export function createSourceManager({ api, state, escapeHtml = value => String(value ?? '') } = {}) {
  const card = document.querySelector('.settings-card');
  const modal = document.querySelector('#settingsModal');
  if (!card || !modal || !api?.getResourceSettings) return null;
  if (card.dataset.cf5Sources === '1') return { refresh: () => {} };
  card.dataset.cf5Sources = '1';

  const panel = document.createElement('section');
  panel.className = 'cf5-sources';
  panel.innerHTML = `
    <header class="cf5-head"><h3 class="cf5-title">片源管理</h3><p class="cf5-count">正在读取</p></header>
    <p class="studio-source-help">电影、剧集和动漫共用这份片源。同一提供商的多个接口收在一项中，展开可查看线路。测速只检查接口，播放情况以实际影片为准。</p>
    <div class="cf5-toolbar"><button class="secondary-button cf5-test-all" type="button">全部测速</button></div>
    <p class="cf5-status" role="status" aria-live="polite"></p>
    <div class="cf5-list" role="list" aria-label="片源列表"></div>
    <div class="cf5-import">
      <label class="settings-label" for="cf5SourceInput">导入自定义源（替换现有自定义接口）</label>
      <textarea id="cf5SourceInput" class="settings-input cf5-input" rows="4" spellcheck="false" placeholder="一行一个：名称|接口地址，也支持 TVBox 配置 / JSON 数组 / 配置地址"></textarea>
      <div class="settings-actions">
        <button class="primary-button cf5-import-btn" type="button">导入并刷新</button>
        <button class="secondary-button cf5-clear-btn" type="button">清空自定义源</button>
      </div>
    </div>`;
  card.append(panel);
  const listEl = panel.querySelector('.cf5-list');
  const countEl = panel.querySelector('.cf5-count');
  const statusEl = panel.querySelector('.cf5-status');
  const inputEl = panel.querySelector('#cf5SourceInput');
  const speeds = new Map();
  let sources = [];
  let busy = false;
  let revision = 0;

  function latencyMarkup(source) {
    const hit = speeds.get(source.key);
    if (hit) return `<span class="cf5-latency ${hit.ok ? 'is-ok' : 'is-bad'}" title="${escapeHtml(hit.error || '接口响应时间')}">${hit.ok ? `${Math.round(hit.elapsedMs)} ms` : '检查失败'}</span>`;
    if (source.verification?.playlist) return `<span class="cf5-latency is-ok" title="${escapeHtml(source.verification.checkedAt)}：样例搜索、详情和 HLS 清单通过">清单已验证</span>`;
    if (source.probe) return `<span class="cf5-latency${source.probe.catalog ? '' : ' is-bad'}" title="${escapeHtml(source.probe.checkedAt + '：' + (source.probe.error || '仅代表上次检查结果'))}">${source.probe.detail ? '详情通过' : source.probe.search ? '搜索通过' : source.probe.catalog ? '接口通过' : '上次检查未通过'}</span>`;
    return '<span class="cf5-latency">未测</span>';
  }

  function sourceMarkup(source, name = source.name) {
    return `<div class="cf5-item" data-id="${escapeHtml(source.key)}">
      <div class="cf5-item-main"><strong>${escapeHtml(name || '未命名源')}</strong><p class="cf5-api" title="${escapeHtml(source.api)}">${escapeHtml(source.api)}</p></div>
      <div class="cf5-tags"><span class="cf5-tag cf5-origin${source.origin === 'custom' ? ' is-custom' : ''}">${source.origin === 'custom' ? '自定义' : '内置'}</span>${source.contentTypes?.includes('anime') ? '<span class="cf5-tag">含动漫</span>' : ''}${source.enabled === false ? '<span class="cf5-tag">已停用</span>' : ''}</div>
      <span class="cf5-slot">${latencyMarkup(source)}</span>
      <button class="ghost-button cf5-test" type="button" ${busy ? 'disabled' : ''} aria-label="检查${escapeHtml(name)}接口">测速</button>
      ${source.origin === 'custom' ? `<button class="ghost-button cf5-remove" type="button" ${busy ? 'disabled' : ''} aria-label="删除${escapeHtml(name)}接口">×</button>` : ''}
    </div>`;
  }

  function render() {
    const opened = new Set([...listEl.querySelectorAll('details[open]')].map(el => el.dataset.provider));
    const groups = new Map();
    for (const source of sources) {
      const provider = source.provider || { key: source.name || source.api, name: source.name };
      if (!groups.has(provider.key)) groups.set(provider.key, { ...provider, sources: [] });
      groups.get(provider.key).sources.push(source);
    }
    countEl.textContent = `${groups.size} 个片源 · ${sources.length} 条接口`;
    listEl.innerHTML = [...groups.values()].map(group => group.sources.length === 1
      ? `<div role="listitem" data-provider="${escapeHtml(group.key)}">${sourceMarkup(group.sources[0], group.name)}</div>`
      : `<details class="studio-source-group" role="listitem" data-provider="${escapeHtml(group.key)}" ${opened.has(group.key) ? 'open' : ''}>
          <summary><strong>${escapeHtml(group.name)}</strong><span>${group.sources.length} 条接口 · 展开线路</span></summary>
          <div class="studio-source-lines">${group.sources.map((source, index) => sourceMarkup(source, `线路 ${index + 1}`)).join('')}</div>
        </details>`).join('') || '<p class="cf5-empty">暂无播放源</p>';
  }

  function applySettings(settings) {
    revision += 1;
    sources = Array.isArray(settings?.sources) ? settings.sources : [];
    if (state) {
      state.resourceSettings = { ...state.resourceSettings, ...settings };
      if (state.credential) state.credential.resources = state.resourceSettings;
    }
    render();
    window.dispatchEvent(new CustomEvent('cineflow:resource-settings', { detail: settings }));
  }

  async function refresh() {
    const current = revision;
    try {
      const settings = await api.getResourceSettings();
      if (revision === current && !busy) applySettings(settings);
    } catch (error) { statusEl.textContent = error?.message || '片源读取失败'; }
  }

  function setBusy(value) {
    busy = value;
    panel.querySelectorAll('button,textarea').forEach(el => { el.disabled = value; });
  }

  async function testSources(list) {
    if (busy || !list.length || !api.testResourceSource) return;
    setBusy(true);
    const queue = list.slice();
    let done = 0;
    statusEl.textContent = `检查中 0/${list.length}`;
    try {
      await Promise.all(Array.from({ length: Math.min(TEST_CONCURRENCY, list.length) }, async () => {
        while (queue.length) {
          const source = queue.shift();
          let result;
          try { result = await api.testResourceSource({ key: source.key, api: source.api }); }
          catch (error) { result = { ok: false, error: error?.message || '检查失败' }; }
          speeds.set(source.key, result || { ok: false });
          const slot = listEl.querySelector(`[data-id="${CSS.escape(source.key)}"] .cf5-slot`);
          if (slot) slot.innerHTML = latencyMarkup(source);
          statusEl.textContent = `检查中 ${++done}/${list.length}`;
        }
      }));
      const failed = list.filter(source => !speeds.get(source.key)?.ok).length;
      statusEl.textContent = `完成 ${list.length} 条接口检查${failed ? ` · ${failed} 条未通过` : ' · 全部通过'}`;
    } finally { setBusy(false); }
  }

  async function mutate(operation, message) {
    if (busy) return;
    setBusy(true);
    try {
      const settings = await operation();
      applySettings(settings);
      statusEl.textContent = message(settings);
    } catch (error) { statusEl.textContent = error?.message || '片源更新失败'; }
    finally { setBusy(false); }
  }

  listEl.addEventListener('click', event => {
    const row = event.target.closest('[data-id]');
    const source = sources.find(item => item.key === row?.dataset.id);
    if (!source || busy) return;
    if (event.target.closest('.cf5-test')) testSources([source]);
    if (event.target.closest('.cf5-remove')) {
      const rest = sources.filter(item => item.origin === 'custom' && item.key !== source.key);
      // 替换接口时完整保留其他源的标识、启用状态和查询参数。
      mutate(() => rest.length ? api.importResourceSources(JSON.stringify(rest)) : api.clearResourceSources(), () => `已删除 ${source.name}`);
    }
  });
  panel.querySelector('.cf5-test-all').addEventListener('click', () => testSources(sources));
  panel.querySelector('.cf5-import-btn').addEventListener('click', () => {
    const payload = inputEl.value.trim();
    if (!payload) { statusEl.textContent = '请先粘贴源配置'; return; }
    mutate(() => api.importResourceSources(payload), settings => {
      inputEl.value = '';
      return `导入完成 · 自定义 ${settings.customSourceCount || 0} 条接口${settings.importReport?.skipped ? ` · 跳过 ${settings.importReport.skipped} 条不兼容线路` : ''}`;
    });
  });
  panel.querySelector('.cf5-clear-btn').addEventListener('click', () => mutate(() => api.clearResourceSources(), () => {
    inputEl.value = '';
    return '自定义源已清空';
  }));

  let opened = false;
  new MutationObserver(() => {
    const visible = !modal.classList.contains('is-hidden');
    if (visible && !opened) refresh();
    opened = visible;
  }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  return { refresh, el: panel };
}

export function initIncrementalSourceManager(deps = {}) {
  try { return createSourceManager(deps) !== null; }
  catch (error) {
    console.warn('[CineFlow] 片源管理面板装配失败', error);
    return false;
  }
}
