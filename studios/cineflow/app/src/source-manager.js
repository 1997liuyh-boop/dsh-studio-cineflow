// 片源设置只使用主进程的同一份清单；提供商分组仅影响展示，保留不同播放线路。
// v0.3.0：增加片源健康状态（自动停用 / 一键恢复）、片源订阅与导出。
const TEST_CONCURRENCY = 2;

const REFRESH_OPTIONS = [
  { value: 1, label: '每天更新' },
  { value: 7, label: '每周更新' },
  { value: 30, label: '每月更新' },
  { value: 0, label: '仅手动更新' }
];

function formatClock(timestamp) {
  const date = new Date(Number(timestamp) || 0);
  if (!timestamp || Number.isNaN(date.getTime())) return '';
  const sameDay = date.toDateString() === new Date().toDateString();
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return sameDay ? time : `${date.getMonth() + 1}月${date.getDate()}日 ${time}`;
}

export function createSourceManager({ api, state, escapeHtml = value => String(value ?? '') } = {}) {
  const card = document.querySelector('.settings-card');
  const modal = document.querySelector('#settingsModal');
  if (!card || !modal || !api?.getResourceSettings) return null;
  if (card.dataset.cf5Sources === '1') return { refresh: () => {} };
  card.dataset.cf5Sources = '1';
  const vodApi = window.cineflowVod || null;

  const panel = document.createElement('section');
  panel.className = 'cf5-sources';
  panel.innerHTML = `
    <header class="cf5-head"><h3 class="cf5-title">片源管理</h3><p class="cf5-count">正在读取</p></header>
    <p class="studio-source-help">电影、剧集和动漫共用这份片源。同一提供商的多个接口收在一项中，展开可查看线路。搜索时连续失败两次的片源会自动停用（30 分钟 → 24 小时 → 长期），可随时恢复。</p>
    <div class="cf5-toolbar">
      <button class="secondary-button cf5-test-all" type="button">全部测速</button>
      ${vodApi ? '<button class="secondary-button cf5-restore-all" type="button">恢复全部停用</button><button class="secondary-button cf5-export" type="button">导出片源</button>' : ''}
    </div>
    <p class="cf5-status" role="status" aria-live="polite"></p>
    <div class="cf5-list" role="list" aria-label="片源列表"></div>
    ${vodApi ? `
    <div class="cf5-subs">
      <h4 class="cf5-subtitle">片源订阅</h4>
      <p class="studio-source-help">填写 LibreTV 源列表 JSON 或 TVBox 配置地址。订阅的点播源与直播源按周期自动更新，单独存放，不会覆盖自定义源；需要专用爬虫的 TVBox 线路与成人内容会跳过。已预置几个实测可用的公开订阅，不需要可以删除，删除后不会再自动添加。</p>
      <div class="cf5-sub-list" role="list" aria-label="订阅列表"></div>
      <div class="cf5-sub-add">
        <input class="settings-input cf5-sub-url" type="url" spellcheck="false" placeholder="订阅地址，例如 https://example.com/sources.json" aria-label="订阅地址" />
        <select class="settings-input cf5-sub-days" aria-label="更新周期">${REFRESH_OPTIONS.map(option => `<option value="${option.value}">${option.label}</option>`).join('')}</select>
        <button class="primary-button cf5-sub-add-btn" type="button">添加订阅</button>
      </div>
    </div>` : ''}
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
  const subListEl = panel.querySelector('.cf5-sub-list');
  const speeds = new Map();
  let healthMap = new Map();
  let subscriptions = [];
  let sources = [];
  let busy = false;
  let revision = 0;

  function latencyMarkup(source) {
    const hit = speeds.get(source.key);
    if (hit) return `<span class="cf5-latency ${hit.ok ? 'is-ok' : 'is-bad'}" title="${escapeHtml(hit.error || '接口响应时间')}">${hit.ok ? `${Math.round(hit.elapsedMs)} ms` : '检查失败'}</span>`;
    const health = healthMap.get(source.key)?.health;
    if (health?.status === 'ok' && health.ms) return `<span class="cf5-latency is-ok" title="最近一次搜索的耗时">搜索 ${Math.round(health.ms)} ms</span>`;
    if (source.verification?.playlist) return `<span class="cf5-latency is-ok" title="${escapeHtml(source.verification.checkedAt)}：样例搜索、详情和 HLS 清单通过">清单已验证</span>`;
    if (source.probe) return `<span class="cf5-latency${source.probe.catalog ? '' : ' is-bad'}" title="${escapeHtml(source.probe.checkedAt + '：' + (source.probe.error || '仅代表上次检查结果'))}">${source.probe.detail ? '详情通过' : source.probe.search ? '搜索通过' : source.probe.catalog ? '接口通过' : '上次检查未通过'}</span>`;
    return '<span class="cf5-latency">未测</span>';
  }

  function healthMarkup(source) {
    const entry = healthMap.get(source.key);
    const health = entry?.health;
    if (!health) return '';
    if (health.status === 'disabled') {
      const until = health.permanent ? '长期停用' : `停用至 ${formatClock(health.disabledUntil)}`;
      return `<span class="cf5-tag is-bad" title="${escapeHtml(health.error || '连续搜索失败')}">${until}</span>`;
    }
    if (health.status === 'failing') return `<span class="cf5-tag is-warn" title="${escapeHtml(health.error || '')}">${escapeHtml(health.label)}</span>`;
    return '';
  }

  function originLabel(source) {
    if (source.origin === 'custom') return '<span class="cf5-tag cf5-origin is-custom">自定义</span>';
    if (source.origin === 'subscription') return '<span class="cf5-tag cf5-origin is-subscription" title="来自订阅，随订阅更新">订阅</span>';
    return '<span class="cf5-tag cf5-origin">内置</span>';
  }

  function sourceMarkup(source, name = source.name) {
    const disabled = healthMap.get(source.key)?.disabled;
    return `<div class="cf5-item${disabled ? ' is-disabled' : ''}" data-id="${escapeHtml(source.key)}">
      <div class="cf5-item-main"><strong>${escapeHtml(name || '未命名源')}</strong><p class="cf5-api" title="${escapeHtml(source.api)}">${escapeHtml(source.api)}</p></div>
      <div class="cf5-tags">${originLabel(source)}${source.contentTypes?.includes('anime') ? '<span class="cf5-tag">含动漫</span>' : ''}${source.enabled === false ? '<span class="cf5-tag">已停用</span>' : ''}${healthMarkup(source)}</div>
      <span class="cf5-slot">${latencyMarkup(source)}</span>
      ${disabled ? `<button class="ghost-button cf5-restore" type="button" ${busy ? 'disabled' : ''} aria-label="恢复${escapeHtml(name)}">恢复</button>` : ''}
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
    const disabledCount = sources.filter(source => healthMap.get(source.key)?.disabled).length;
    countEl.textContent = `${groups.size} 个片源 · ${sources.length} 条接口${disabledCount ? ` · ${disabledCount} 条已自动停用` : ''}`;
    listEl.innerHTML = [...groups.values()].map(group => group.sources.length === 1
      ? `<div role="listitem" data-provider="${escapeHtml(group.key)}">${sourceMarkup(group.sources[0], group.name)}</div>`
      : `<details class="studio-source-group" role="listitem" data-provider="${escapeHtml(group.key)}" ${opened.has(group.key) ? 'open' : ''}>
          <summary><strong>${escapeHtml(group.name)}</strong><span>${group.sources.length} 条接口 · 展开线路</span></summary>
          <div class="studio-source-lines">${group.sources.map((source, index) => sourceMarkup(source, `线路 ${index + 1}`)).join('')}</div>
        </details>`).join('') || '<p class="cf5-empty">暂无播放源</p>';
  }

  function subscriptionStatus(item) {
    if (item.lastStatus === 'error') return `<span class="is-bad">同步失败：${escapeHtml(item.lastError || '未知错误')}${item.paused ? '（已暂停自动更新）' : ''}</span>`;
    if (!item.lastSync) return '尚未同步';
    const counts = item.lastCounts || {};
    const skipped = counts.skipped ? ` · 跳过 ${counts.skipped} 条（${escapeHtml(Object.keys(counts.skippedByReason || {}).join('、'))}）` : '';
    return `${formatClock(item.lastSync)} 同步 · ${item.sourceCount} 个点播源 · ${item.liveCount} 个直播源${skipped}`;
  }

  function renderSubscriptions() {
    if (!subListEl) return;
    subListEl.innerHTML = subscriptions.map(item => `
      <div class="cf5-sub" role="listitem" data-sub="${escapeHtml(item.url)}">
        <div class="cf5-item-main">
          <strong>${escapeHtml(item.name || item.url)}${item.builtin ? ' <span class="cf5-tag cf5-origin">内置</span>' : ''}</strong>
          <p class="cf5-api" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</p>
          <p class="cf5-sub-status">${subscriptionStatus(item)}</p>
        </div>
        <select class="settings-input cf5-sub-days-row" aria-label="更新周期" ${busy ? 'disabled' : ''}>${REFRESH_OPTIONS.map(option => `<option value="${option.value}" ${Number(item.refreshDays ?? 1) === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}</select>
        <button class="ghost-button cf5-sub-sync" type="button" ${busy ? 'disabled' : ''}>同步</button>
        <button class="ghost-button cf5-sub-remove" type="button" ${busy ? 'disabled' : ''} aria-label="删除订阅">×</button>
      </div>
    `).join('') || '<p class="cf5-empty">还没有订阅</p>';
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

  async function loadHealth() {
    if (!vodApi?.healthList) return;
    try {
      const list = await vodApi.healthList();
      healthMap = new Map((Array.isArray(list) ? list : []).map(item => [item.key, item]));
    } catch {
      // 健康度读取失败时只是不显示状态
    }
  }

  async function loadSubscriptions() {
    if (!vodApi?.subscriptions) return;
    try {
      subscriptions = await vodApi.subscriptions() || [];
    } catch {
      subscriptions = [];
    }
    renderSubscriptions();
  }

  async function refresh() {
    const current = revision;
    try {
      const [settings] = await Promise.all([api.getResourceSettings(), loadHealth(), loadSubscriptions()]);
      if (revision === current && !busy) applySettings(settings);
    } catch (error) { statusEl.textContent = error?.message || '片源读取失败'; }
  }

  function setBusy(value) {
    busy = value;
    panel.querySelectorAll('button,textarea,input,select').forEach(el => { el.disabled = value; });
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

  /** 订阅、健康度类操作：执行后整体刷新片源与订阅。 */
  async function runAndRefresh(operation, message) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await operation();
      statusEl.textContent = typeof message === 'function' ? message(result) : message;
    } catch (error) {
      statusEl.textContent = error?.message || '操作失败';
    } finally {
      setBusy(false);
      await refresh();
    }
  }

  function syncMessage(result) {
    if (!result) return '同步完成';
    if (result.ok === false) return `同步失败：${result.error || '请检查订阅地址'}`;
    if (Array.isArray(result.results)) {
      const failed = result.results.filter(item => !item.ok).length;
      return `已同步 ${result.results.length} 个订阅${failed ? ` · ${failed} 个失败` : ''}`;
    }
    return `同步完成 · ${result.sources || 0} 个点播源 · ${result.live || 0} 个直播源${result.stats?.skipped ? ` · 跳过 ${result.stats.skipped} 条不兼容线路` : ''}`;
  }

  listEl.addEventListener('click', event => {
    const row = event.target.closest('[data-id]');
    const source = sources.find(item => item.key === row?.dataset.id);
    if (!source || busy) return;
    if (event.target.closest('.cf5-test')) testSources([source]);
    if (event.target.closest('.cf5-restore')) runAndRefresh(() => vodApi.healthReset(source.key), `已恢复 ${source.name}`);
    if (event.target.closest('.cf5-remove')) {
      const rest = sources.filter(item => item.origin === 'custom' && item.key !== source.key);
      // 替换接口时完整保留其他源的标识、启用状态和查询参数。
      mutate(() => rest.length ? api.importResourceSources(JSON.stringify(rest)) : api.clearResourceSources(), () => `已删除 ${source.name}`);
    }
  });
  panel.querySelector('.cf5-test-all').addEventListener('click', () => testSources(sources));
  panel.querySelector('.cf5-restore-all')?.addEventListener('click', () => runAndRefresh(() => vodApi.healthReset(''), '已恢复全部自动停用的片源'));
  panel.querySelector('.cf5-export')?.addEventListener('click', () => runAndRefresh(async () => {
    const text = await vodApi.exportSources();
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      // 剪贴板不可用时只保存文件
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    link.download = 'cineflow-sources.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    return copied;
  }, copied => `已导出 LibreTV 源列表格式${copied ? '，并复制到剪贴板' : ''}`));

  panel.querySelector('.cf5-sub-add-btn')?.addEventListener('click', () => {
    const url = panel.querySelector('.cf5-sub-url').value.trim();
    const refreshDays = Number(panel.querySelector('.cf5-sub-days').value);
    if (!url) { statusEl.textContent = '请先填写订阅地址'; return; }
    runAndRefresh(async () => {
      const result = await vodApi.addSubscription(url, { refreshDays });
      if (result?.ok) panel.querySelector('.cf5-sub-url').value = '';
      return result;
    }, syncMessage);
  });
  subListEl?.addEventListener('click', event => {
    const row = event.target.closest('[data-sub]');
    const url = row?.dataset.sub;
    if (!url || busy) return;
    if (event.target.closest('.cf5-sub-sync')) runAndRefresh(() => vodApi.syncSubscriptions(url), syncMessage);
    if (event.target.closest('.cf5-sub-remove')) runAndRefresh(() => vodApi.removeSubscription(url), '已删除订阅及其导入的片源');
  });
  subListEl?.addEventListener('change', event => {
    const select = event.target.closest('.cf5-sub-days-row');
    const url = select?.closest('[data-sub]')?.dataset.sub;
    if (!url) return;
    runAndRefresh(() => vodApi.updateSubscription(url, { refreshDays: Number(select.value) }), '已更新订阅周期');
  });
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
