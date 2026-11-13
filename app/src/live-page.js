// 直播页：直播源切换、分组浏览、频道搜索、收藏与最近观看、节目单（正在播 / 下一个）、测活排序。
// 播放复用应用内播放器：同组频道作为播放列表传入，播放器里可直接切台。

const STORE_KEY = 'cineflow:live:v1';
const PROBE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_RECENT = 20;
const RENDER_LIMIT = 400; // 单次最多渲染的频道数，搜索可缩小范围
const EPG_BATCH = 200;

function readStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
      source: String(parsed.source || ''),
      probe: parsed.probe && typeof parsed.probe === 'object' ? parsed.probe : {}
    };
  } catch {
    return { favorites: [], recent: [], source: '', probe: {} };
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // 存储不可用时只是记不住收藏
  }
}

function formatClock(timestamp) {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function normalizeSearch(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase().replace(/[\s\-_.·]+/g, '');
}

/** 直播地址的播放引擎：.flv 用 flv.js，常见文件格式直接播放，其余（含无扩展名）按 HLS 处理。 */
function liveKindOf(url) {
  if (/\.flv(?:$|[?#])/i.test(url)) return 'flv';
  if (/\.(?:mp4|webm|m4v)(?:$|[?#])/i.test(url)) return 'mp4';
  if (/\.ts(?:$|[?#])/i.test(url)) return 'mpegts';
  return 'hls';
}

export function createLivePage({ escapeHtml = (value) => String(value ?? ''), toast = () => {} } = {}) {
  const liveApi = window.cineflowLive || null;
  const view = document.createElement('div');
  view.className = 'cf3-page cf-live';
  view.innerHTML = `
    <header class="cf3-head cf-live-head">
      <div>
        <p class="eyebrow">LIVE</p>
        <h2 class="cf3-title">直播</h2>
      </div>
      <div class="cf-live-tools">
        <select class="settings-input cf-live-source" aria-label="直播源"></select>
        <button class="secondary-button cf-live-probe" type="button">测活排序</button>
        <button class="secondary-button cf-live-manage-btn" type="button">管理直播源</button>
      </div>
    </header>
    <div class="cf-live-manage is-hidden">
      <p class="studio-source-help">一行一个：<code>名称|M3U 地址|节目单地址（可选）</code>。也可以在设置 → 片源管理里添加包含直播源的订阅。</p>
      <textarea class="settings-input cf-live-input" rows="4" spellcheck="false" placeholder="示例|https://example.com/live.m3u|https://example.com/epg.xml.gz"></textarea>
      <div class="settings-actions"><button class="primary-button cf-live-save" type="button">保存直播源</button></div>
    </div>
    <p class="cf-live-status" role="status" aria-live="polite"></p>
    <div class="cf-live-body">
      <nav class="cf-live-groups" aria-label="频道分组"></nav>
      <section class="cf-live-main">
        <input class="settings-input cf-live-search" type="search" placeholder="搜索频道" aria-label="搜索频道" />
        <div class="cf-live-list" role="list" aria-label="频道列表"></div>
      </section>
    </div>
  `;
  const sourceSelect = view.querySelector('.cf-live-source');
  const statusEl = view.querySelector('.cf-live-status');
  const groupsEl = view.querySelector('.cf-live-groups');
  const listEl = view.querySelector('.cf-live-list');
  const searchEl = view.querySelector('.cf-live-search');
  const manageEl = view.querySelector('.cf-live-manage');
  const inputEl = view.querySelector('.cf-live-input');

  const store = readStore();
  let sources = [];
  let current = null; // { source, playlist }
  let group = '全部';
  let query = '';
  let epg = {}; // channelId → { now, next }
  let loadSeq = 0;
  let activated = false;

  const setStatus = (text) => { statusEl.textContent = text || ''; };
  const probeOf = (url) => {
    const hit = store.probe[url];
    return hit && Date.now() - hit.at < PROBE_TTL_MS ? hit : null;
  };

  function visibleChannels() {
    const channels = current?.playlist?.channels || [];
    let list;
    if (group === '收藏') list = channels.filter((channel) => store.favorites.includes(channel.url));
    else if (group === '最近') {
      const order = store.recent.map((item) => item.url);
      list = channels.filter((channel) => order.includes(channel.url)).sort((a, b) => order.indexOf(a.url) - order.indexOf(b.url));
    } else if (group === '全部') list = channels;
    else list = channels.filter((channel) => channel.group === group);
    if (query) list = list.filter((channel) => normalizeSearch(`${channel.name} ${channel.group}`).includes(query));
    // 测过的频道：可用的按耗时排前，失败的排后
    const rank = (channel) => {
      const probe = probeOf(channel.url);
      if (!probe) return 1e6;
      return probe.ok ? probe.ms : 2e6;
    };
    if (list.some((channel) => probeOf(channel.url))) list = [...list].sort((a, b) => rank(a) - rank(b));
    return list;
  }

  function renderSources() {
    sourceSelect.innerHTML = sources.length
      ? sources.map((source) => `<option value="${escapeHtml(source.url)}" ${current?.source?.url === source.url ? 'selected' : ''}>${escapeHtml(source.name)}${source.origin === 'subscription' ? '（订阅）' : ''}</option>`).join('')
      : '<option value="">暂无直播源</option>';
    inputEl.value = sources.filter((source) => source.origin === 'custom').map((source) => [source.name, source.url, source.epg].filter(Boolean).join('|')).join('\n');
  }

  function renderGroups() {
    const groups = current?.playlist?.groups || [];
    const items = [
      { name: '全部', count: current?.playlist?.channels?.length || 0 },
      { name: '收藏', count: (current?.playlist?.channels || []).filter((channel) => store.favorites.includes(channel.url)).length },
      { name: '最近', count: (current?.playlist?.channels || []).filter((channel) => store.recent.some((item) => item.url === channel.url)).length },
      ...groups
    ];
    groupsEl.innerHTML = items.map((item) => `
      <button class="cf-live-group${item.name === group ? ' is-active' : ''}" type="button" data-live-group="${escapeHtml(item.name)}">
        <span>${escapeHtml(item.name)}</span><em>${item.count}</em>
      </button>
    `).join('');
  }

  function epgMarkup(channel) {
    const info = epg[channel.id];
    if (!info) return '';
    const now = info.now ? `正在播：${escapeHtml(info.now.title)}` : '';
    const next = info.next ? `${formatClock(info.next.start)} ${escapeHtml(info.next.title)}` : '';
    return `<p class="cf-live-epg">${[now, next ? `下一个：${next}` : ''].filter(Boolean).join(' · ')}</p>`;
  }

  function probeMarkup(channel) {
    const probe = probeOf(channel.url);
    if (!probe) return '';
    return probe.ok
      ? `<span class="cf-live-probe-tag${probe.ms > 2000 ? ' is-slow' : ''}">${probe.ms} ms</span>`
      : `<span class="cf-live-probe-tag is-bad" title="${escapeHtml(probe.error || '')}">不可用</span>`;
  }

  function renderList() {
    const list = visibleChannels();
    if (!current) {
      listEl.innerHTML = `<div class="cf5-empty cf-live-empty">${sources.length ? '正在读取直播源…' : '还没有直播源。点击「管理直播源」添加 M3U 地址，或在设置 → 片源管理里添加包含直播源的订阅。'}</div>`;
      return;
    }
    if (!list.length) {
      listEl.innerHTML = `<div class="cf5-empty cf-live-empty">${group === '收藏' ? '还没有收藏的频道，点击频道右侧的 ☆ 收藏。' : '没有匹配的频道。'}</div>`;
      return;
    }
    const shown = list.slice(0, RENDER_LIMIT);
    listEl.innerHTML = shown.map((channel) => {
      const favorite = store.favorites.includes(channel.url);
      return `
        <div class="cf-live-channel" role="listitem" data-live-url="${escapeHtml(channel.url)}" tabindex="0">
          <div class="cf-live-logo">${channel.logo ? `<img src="${escapeHtml(channel.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : `<span>${escapeHtml(channel.name.slice(0, 2))}</span>`}</div>
          <div class="cf-live-info">
            <strong>${escapeHtml(channel.name)}</strong>
            <small>${escapeHtml(channel.group)}</small>
            ${epgMarkup(channel)}
          </div>
          ${probeMarkup(channel)}
          <button class="cf-live-fav${favorite ? ' is-on' : ''}" type="button" data-live-fav="1" aria-label="${favorite ? '取消收藏' : '收藏'}">${favorite ? '★' : '☆'}</button>
        </div>
      `;
    }).join('') + (list.length > shown.length ? `<p class="cf5-empty">还有 ${list.length - shown.length} 个频道，请用搜索缩小范围。</p>` : '');
    loadEpg(shown);
  }

  async function loadEpg(channels) {
    const epgUrl = current?.source?.epg || current?.playlist?.epgUrl;
    if (!liveApi || !epgUrl) return;
    const seq = loadSeq;
    const missing = channels.filter((channel) => !(channel.id in epg)).slice(0, EPG_BATCH);
    if (!missing.length) return;
    for (const channel of missing) epg[channel.id] = epg[channel.id] || null;
    const result = await liveApi.epg(epgUrl, missing.map(({ id, tvgId, tvgName, name }) => ({ id, tvgId, tvgName, name }))).catch(() => null);
    if (seq !== loadSeq || !result?.ok) return;
    Object.assign(epg, result.items);
    // 只更新节目单文字，不重绘整个列表
    for (const channel of missing) {
      if (!result.items[channel.id]) continue;
      const row = listEl.querySelector(`[data-live-url="${CSS.escape(channel.url)}"] .cf-live-info`);
      if (!row) continue;
      row.querySelector('.cf-live-epg')?.remove();
      row.insertAdjacentHTML('beforeend', epgMarkup(channel));
    }
  }

  async function loadSource(source, { force = false } = {}) {
    const seq = ++loadSeq;
    current = null;
    epg = {};
    group = '全部';
    renderGroups();
    renderList();
    if (!source || !liveApi) return;
    setStatus(`正在读取「${source.name}」…`);
    const playlist = await liveApi.playlist(source.url, { force }).catch((error) => ({ ok: false, error: String(error?.message || error) }));
    if (seq !== loadSeq) return;
    if (!playlist?.ok) {
      setStatus(playlist?.error || '播放列表读取失败');
      listEl.innerHTML = `<div class="cf5-empty cf-live-empty">${escapeHtml(playlist?.error || '播放列表读取失败')}</div>`;
      return;
    }
    current = { source, playlist };
    store.source = source.url;
    writeStore(store);
    setStatus(`${playlist.channels.length} 个频道 · ${playlist.groups.length} 个分组${source.epg || playlist.epgUrl ? ' · 已关联节目单' : ''}`);
    renderGroups();
    renderList();
  }

  async function refreshSources() {
    if (!liveApi) {
      setStatus('当前版本的宿主不支持直播功能。');
      return;
    }
    sources = await liveApi.sources().catch(() => []) || [];
    const preferred = sources.find((source) => source.url === (current?.source?.url || store.source)) || sources[0] || null;
    renderSources();
    if (!preferred) {
      current = null;
      renderGroups();
      renderList();
      return;
    }
    if (current?.source?.url !== preferred.url) await loadSource(preferred);
  }

  function play(channel) {
    const list = visibleChannels().slice(0, RENDER_LIMIT);
    const index = Math.max(0, list.findIndex((item) => item.url === channel.url));
    const sourceName = current?.source?.name || '直播';
    const playlist = list.map((item, episodeIndex) => ({
      url: item.url,
      kind: liveKindOf(item.url),
      format: '直播',
      needsResolve: false,
      title: item.name,
      sourceName: `直播 · ${sourceName}`,
      lineName: item.group,
      label: item.name,
      displayLabel: item.name,
      episodeIndex,
      episodeNo: episodeIndex + 1,
      total: list.length
    }));
    store.recent = [{ url: channel.url, name: channel.name, at: Date.now() }, ...store.recent.filter((item) => item.url !== channel.url)].slice(0, MAX_RECENT);
    writeStore(store);
    const open = window.__cineflowOpenResourcePlayer;
    if (typeof open !== 'function') {
      toast('播放器尚未就绪');
      return;
    }
    open({ ...playlist[index], playlist, episodeIndex: index, live: true });
  }

  async function probeVisible() {
    const list = visibleChannels().slice(0, 120);
    if (!list.length || !liveApi) return;
    const button = view.querySelector('.cf-live-probe');
    button.disabled = true;
    setStatus(`正在测活 ${list.length} 个频道…`);
    try {
      const results = await liveApi.probe(list.map((channel) => channel.url));
      const now = Date.now();
      for (const result of results || []) store.probe[result.url] = { ok: result.ok, ms: result.ms, error: result.error || '', at: now };
      // 清理过期测活记录
      for (const [url, hit] of Object.entries(store.probe)) if (now - hit.at > PROBE_TTL_MS) delete store.probe[url];
      writeStore(store);
      const ok = (results || []).filter((result) => result.ok).length;
      setStatus(`测活完成：${ok}/${list.length} 个频道可用，已按速度排序`);
      renderList();
    } finally {
      button.disabled = false;
    }
  }

  sourceSelect.addEventListener('change', () => {
    const source = sources.find((item) => item.url === sourceSelect.value);
    if (source) loadSource(source);
  });
  groupsEl.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-live-group]') : null;
    if (!button) return;
    group = button.getAttribute('data-live-group');
    renderGroups();
    renderList();
    listEl.scrollTop = 0;
  });
  let searchTimer = 0;
  searchEl.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      query = normalizeSearch(searchEl.value);
      renderList();
    }, 180);
  });
  listEl.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const row = target?.closest('[data-live-url]');
    if (!row) return;
    const channel = current?.playlist?.channels?.find((item) => item.url === row.getAttribute('data-live-url'));
    if (!channel) return;
    if (target.closest('[data-live-fav]')) {
      const index = store.favorites.indexOf(channel.url);
      if (index >= 0) store.favorites.splice(index, 1);
      else store.favorites.unshift(channel.url);
      writeStore(store);
      renderGroups();
      renderList();
      return;
    }
    play(channel);
  });
  listEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const row = event.target instanceof Element ? event.target.closest('[data-live-url]') : null;
    const channel = row && current?.playlist?.channels?.find((item) => item.url === row.getAttribute('data-live-url'));
    if (channel) play(channel);
  });
  view.querySelector('.cf-live-probe').addEventListener('click', probeVisible);
  view.querySelector('.cf-live-manage-btn').addEventListener('click', () => manageEl.classList.toggle('is-hidden'));
  view.querySelector('.cf-live-save').addEventListener('click', async () => {
    const list = inputEl.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
      const [first, second, third] = line.split('|').map((part) => part.trim());
      return /^https?:\/\//i.test(first) ? { url: first, epg: second || '' } : { name: first, url: second || '', epg: third || '' };
    });
    try {
      await liveApi.saveSources(list);
      manageEl.classList.add('is-hidden');
      setStatus('直播源已保存');
      current = null;
      await refreshSources();
    } catch (error) {
      setStatus(`保存失败：${String(error?.message || error)}`);
    }
  });

  // 设置里同步订阅后，订阅下发的直播源会变化
  window.addEventListener('cineflow:resource-settings', () => { if (activated) refreshSources(); });

  return {
    el: view,
    activate() {
      activated = true;
      return refreshSources();
    },
    settle() {}
  };
}
