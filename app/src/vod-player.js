// ArtPlayer 播放器外壳：替换原生 <video controls>，并提供上一集 / 下一集、自动连播、
// 片头片尾跳过、播放中换源（保留集数与进度）、播放失败自动弹出换源面板。
// 解码与传输仍由 renderer.js 原有的 hls.js / dash.js / flv.js 链路负责：ArtPlayer 的 <video>
// 接管 #resourcePlayer 这个 id，投屏、播放历史、代理回退都继续作用在同一个元素上。

import Artplayer from 'artplayer';
import { normalizeTitle } from '../electron/vod-core.mjs';
import { createSkipMarks, decideSkip } from './skip-marks.js';

const PREFS_KEY = 'cineflow:player-prefs:v1';
const NEXT_DELAY_MS = 1000;
const UNDO_MS = 10000;

Artplayer.RECONNECT_TIME_MAX = 0; // 重连由 renderer 的代理回退与本模块的换源负责
Artplayer.CONTEXTMENU = false;
Artplayer.LOG_VERSION = false;
Artplayer.NOTICE_TIME = 2600;

let art = null;

/** 在 #playerStage 内挂载 ArtPlayer，并让它的 <video> 接管 #resourcePlayer。须在 renderer 读取 DOM 之前执行。 */
export function mountArtPlayer() {
  if (art) return art;
  const stage = document.querySelector('#playerStage');
  const original = document.querySelector('#resourcePlayer');
  if (!stage || !original) return null;
  const holder = document.createElement('div');
  holder.className = 'cf-art-holder';
  stage.insertBefore(holder, stage.firstChild);
  try {
    art = new Artplayer({
      container: holder,
      url: '',
      lang: 'zh-cn',
      theme: '#7fd7c6',
      volume: 0.9,
      autoplay: false,
      autoSize: false,
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      pip: true,
      hotkey: true,
      mutex: true,
      backdrop: true,
      fullscreen: true,
      fullscreenWeb: false, // 播放区设置了 CSS contain，网页全屏会被限制在播放区内，只保留系统全屏
      miniProgressBar: true,
      fastForward: true,
      lock: true,
      autoOrientation: true,
      moreVideoAttr: { preload: 'metadata', playsInline: true }
    });
  } catch {
    holder.remove();
    art = null;
    return null;
  }
  const video = art.template.$video;
  video.id = 'resourcePlayer';
  video.classList.add('resource-player');
  original.remove();
  // ArtPlayer 自己的错误态只在原生 src 失败时出现，新一次加载开始就清掉
  art.on('video:loadstart', () => art.template.$player.classList.remove('art-error'));
  return art;
}

mountArtPlayer();

function readPrefs() {
  try {
    return { autoNext: true, autoSkip: true, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
  } catch {
    return { autoNext: true, autoSkip: true };
  }
}

function writePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // 忽略
  }
}

function formatTime(seconds) {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(value % 60).padStart(2, '0')}`;
}

/**
 * 装配播放器功能。deps：
 * - state：renderer 的全局状态（读取 state.player）
 * - escapeHtml / toast
 * - playEpisode(index)：切到当前播放列表的某一集
 */
export function initVodPlayer({ state, escapeHtml, toast, playEpisode }) {
  if (!art) return null;
  const prefs = readPrefs();
  const skipMarks = createSkipMarks();
  let skipState = { introDone: false, outroDone: false, lastTime: Number.NaN, loadId: -1 };
  let nextTimer = 0;
  let pendingStart = null; // 换源后需要恢复的进度 { loadId, time }

  const player = () => state.player || {};
  const playlist = () => (Array.isArray(player().playlist) ? player().playlist : []);
  const hasNext = () => player().open && Number(player().episodeIndex) < playlist().length - 1;
  const hasPrev = () => player().open && Number(player().episodeIndex) > 0;
  const titleOf = () => player().vod?.title || player().title || '';

  // ---------- 控制栏：上一集 / 下一集 / 换源 ----------
  art.controls.add({
    name: 'cf-prev',
    position: 'left',
    index: 11,
    html: '<span class="cf-art-btn">上一集</span>',
    tooltip: '上一集',
    click: () => hasPrev() && playEpisode(Number(player().episodeIndex) - 1)
  });
  art.controls.add({
    name: 'cf-next',
    position: 'left',
    index: 12,
    html: '<span class="cf-art-btn">下一集</span>',
    tooltip: '下一集',
    click: () => hasNext() && playEpisode(Number(player().episodeIndex) + 1)
  });
  art.controls.add({
    name: 'cf-switch',
    position: 'right',
    index: 5,
    html: '<span class="cf-art-btn">换源</span>',
    tooltip: '换一个来源，保留当前集数与进度',
    click: () => toggleSourcePanel()
  });

  function syncControls() {
    const multi = playlist().length > 1;
    const isLive = Boolean(player().live);
    for (const name of ['cf-prev', 'cf-next']) {
      const control = art.controls[name];
      if (!control) continue;
      control.style.display = multi ? '' : 'none';
      // 直播时播放列表是同组频道
      const label = control.querySelector('.cf-art-btn');
      if (label) label.textContent = name === 'cf-prev' ? (isLive ? '上一台' : '上一集') : (isLive ? '下一台' : '下一集');
    }
    const switchControl = art.controls['cf-switch'];
    if (switchControl) switchControl.style.display = player().vod ? '' : 'none';
  }

  // ---------- 设置面板：自动连播、跳过片头片尾 ----------
  const markStatus = () => {
    const mark = skipMarks.get(titleOf());
    if (!mark) return '未标记';
    return [mark.introEnd ? `片头 ${formatTime(mark.introEnd)}` : '', mark.outroLength ? `片尾 ${mark.outroLength} 秒` : ''].filter(Boolean).join(' · ') || '未标记';
  };
  art.setting.add({
    name: 'cf-auto-next',
    html: '自动连播',
    switch: prefs.autoNext,
    onSwitch(item) {
      prefs.autoNext = !item.switch;
      writePrefs(prefs);
      return prefs.autoNext;
    }
  });
  art.setting.add({
    name: 'cf-auto-skip',
    html: '跳过片头片尾',
    switch: prefs.autoSkip,
    onSwitch(item) {
      prefs.autoSkip = !item.switch;
      writePrefs(prefs);
      return prefs.autoSkip;
    }
  });
  art.setting.add({
    name: 'cf-skip-marks',
    html: '片头片尾标记',
    tooltip: markStatus(),
    selector: [
      { html: '当前位置设为片头结束', value: 'intro' },
      { html: '当前位置设为片尾开始', value: 'outro' },
      { html: '清除本作品的标记', value: 'clear' }
    ],
    onSelect(item) {
      const video = art.template.$video;
      let result = { ok: true };
      if (item.value === 'intro') result = skipMarks.markIntroEnd(titleOf(), video.currentTime, video.duration);
      else if (item.value === 'outro') result = skipMarks.markOutroStart(titleOf(), video.currentTime, video.duration);
      else skipMarks.clear(titleOf());
      art.notice.show = result.ok ? `已保存：${markStatus()}（同一作品所有剧集生效）` : result.reason;
      return markStatus();
    }
  });

  // ---------- 撤销跳过提示 ----------
  const undoLayer = document.createElement('div');
  undoLayer.className = 'cf-skip-undo is-hidden';
  // 挂在 ArtPlayer 根节点内，系统全屏时依然可见
  art.template.$player.appendChild(undoLayer);
  let undoTimer = 0;
  function showUndo(text, onUndo) {
    window.clearTimeout(undoTimer);
    undoLayer.innerHTML = `<span>${escapeHtml(text)}</span><button type="button">撤销</button>`;
    undoLayer.classList.remove('is-hidden');
    undoLayer.querySelector('button').onclick = () => {
      onUndo();
      undoLayer.classList.add('is-hidden');
    };
    undoTimer = window.setTimeout(() => undoLayer.classList.add('is-hidden'), UNDO_MS);
  }

  // ---------- 播放进度：片头片尾、续播恢复 ----------
  const video = art.template.$video;
  video.addEventListener('loadedmetadata', () => {
    if (pendingStart && pendingStart.loadId <= player().loadId) {
      const target = pendingStart.time;
      pendingStart = null;
      if (target > 3 && video.duration > target + 5) {
        video.currentTime = target;
        art.notice.show = `已换源，从 ${formatTime(target)} 继续`;
      }
    }
  });
  video.addEventListener('timeupdate', () => {
    const current = player();
    if (!current.open) return;
    if (skipState.loadId !== current.loadId) {
      skipState = { introDone: false, outroDone: false, lastTime: Number.NaN, loadId: current.loadId };
      syncControls();
    }
    if (!prefs.autoSkip) return;
    const decision = decideSkip(skipMarks.get(titleOf()), skipState, video.currentTime, video.duration);
    if (decision?.action === 'intro') {
      const from = decision.from;
      video.currentTime = decision.to;
      showUndo(`已跳过片头（${formatTime(decision.to)}）`, () => { video.currentTime = from; });
    } else if (decision?.action === 'outro') {
      if (prefs.autoNext && hasNext()) {
        art.notice.show = '已跳过片尾，播放下一集';
        playEpisode(Number(current.episodeIndex) + 1);
      } else {
        video.currentTime = Math.max(0, video.duration - 0.5);
      }
    }
  });
  video.addEventListener('ended', () => {
    window.clearTimeout(nextTimer);
    if (!prefs.autoNext || !hasNext()) return;
    const next = Number(player().episodeIndex) + 1;
    const loadId = player().loadId;
    art.notice.show = `即将播放第 ${next + 1} 集`;
    nextTimer = window.setTimeout(() => {
      if (player().loadId === loadId && player().open) playEpisode(next);
    }, NEXT_DELAY_MS);
  });

  // ---------- 换源面板 ----------
  const panel = document.createElement('aside');
  panel.className = 'cf-source-panel is-hidden';
  panel.setAttribute('aria-label', '换源');
  art.template.$player.appendChild(panel);
  let panelState = { candidates: [], searching: false, message: '', key: '' };

  const candidateKey = (entry) => `${entry.sourceKey}:${entry.vodId}`;

  function baseCandidates() {
    const vod = player().vod;
    if (!vod) return [];
    const list = [{ sourceKey: vod.sourceKey, vodId: vod.vodId, sourceName: vod.sourceName, ms: null, current: true }];
    for (const entry of vod.alternatives || []) {
      if (candidateKey(entry) !== candidateKey(vod)) list.push({ ...entry, current: false });
    }
    return list;
  }

  function renderPanel() {
    const vod = player().vod;
    const episodeNo = Number(player().episodeIndex) + 1;
    const rows = [...panelState.candidates].sort((a, b) =>
      Number(b.current) - Number(a.current)
      || Number(a.failed || false) - Number(b.failed || false)
      || (a.ms ?? 1e9) - (b.ms ?? 1e9));
    panel.innerHTML = `
      <header>
        <strong>换源</strong>
        <span>保留第 ${episodeNo} 集与当前进度</span>
        <button class="cf-source-close" type="button" aria-label="关闭">×</button>
      </header>
      ${panelState.message ? `<p class="cf-source-message">${escapeHtml(panelState.message)}</p>` : ''}
      <div class="cf-source-rows">
        ${rows.map((entry) => `
          <button class="cf-source-row${entry.current ? ' is-current' : ''}${entry.failed ? ' is-failed' : ''}${entry.ms > 2000 ? ' is-slow' : ''}" type="button" data-cf-source="${escapeHtml(candidateKey(entry))}" ${entry.current || entry.failed ? 'disabled' : ''}>
            <strong>${escapeHtml(entry.sourceName || entry.sourceKey)}</strong>
            <small>${entry.current ? '当前来源' : entry.failed ? escapeHtml(entry.error || '不可用') : entry.ms != null ? `${entry.ms} 毫秒${entry.episodes ? ` · ${entry.episodes} 集` : ''}` : '未测速'}</small>
          </button>
        `).join('')}
      </div>
      <footer>
        <button class="secondary-button cf-source-more" type="button" ${panelState.searching || !vod ? 'disabled' : ''}>${panelState.searching ? '正在搜索同名来源…' : '搜索更多同名来源'}</button>
      </footer>
    `;
  }

  function openSourcePanel(message = '') {
    const key = player().vod ? candidateKey(player().vod) : '';
    if (panelState.key !== key) panelState = { candidates: baseCandidates(), searching: false, message: '', key };
    panelState.message = message;
    renderPanel();
    panel.classList.remove('is-hidden');
    // 没有候选来源时直接去搜同名来源
    if (panelState.candidates.length <= 1 && !panelState.searching) searchMoreSources();
  }

  function closeSourcePanel() {
    panel.classList.add('is-hidden');
  }

  function toggleSourcePanel() {
    if (panel.classList.contains('is-hidden')) openSourcePanel();
    else closeSourcePanel();
  }

  /** 用片名搜索全部采集站，收集同名（且年份相符）的来源，逐个测速。 */
  async function searchMoreSources() {
    const vod = player().vod;
    const bridge = window.__cineflowVod;
    if (!vod || !bridge?.search) return;
    panelState.searching = true;
    renderPanel();
    try {
      const result = await bridge.search(vod.title);
      const target = normalizeTitle(vod.title);
      const known = new Set(panelState.candidates.map(candidateKey));
      const fresh = [];
      for (const group of result?.groups || []) {
        if (normalizeTitle(group.name) !== target) continue;
        if (vod.year && group.year && group.year !== vod.year) continue;
        for (const item of group.items) {
          const entry = { sourceKey: item.sourceKey, vodId: item.vodId, sourceName: item.sourceName, ms: null, current: false };
          if (known.has(candidateKey(entry))) continue;
          known.add(candidateKey(entry));
          fresh.push(entry);
        }
      }
      panelState.candidates.push(...fresh);
      panelState.searching = false;
      renderPanel();
      // 新来源逐个测速（取详情的耗时），每次 4 个
      let cursor = 0;
      const worker = async () => {
        while (cursor < fresh.length) {
          const entry = fresh[cursor++];
          const startedAt = performance.now();
          try {
            const detail = await bridge.detail(entry.sourceKey, entry.vodId);
            entry.ms = detail?.ok ? Math.round(detail.ms ?? performance.now() - startedAt) : null;
            entry.failed = !detail?.ok;
            entry.error = detail?.error || '';
            entry.detail = detail?.ok ? detail : null;
            entry.episodes = detail?.ok ? Math.max(...detail.lines.map((line) => line.episodes.length)) : 0;
          } catch (error) {
            entry.failed = true;
            entry.error = String(error?.message || error);
          }
          if (!panel.classList.contains('is-hidden')) renderPanel();
        }
      };
      await Promise.all(Array.from({ length: Math.min(4, fresh.length) }, worker));
      if (!fresh.length) {
        panelState.message = '没有找到更多同名来源。';
        renderPanel();
      }
    } catch (error) {
      panelState.searching = false;
      panelState.message = `搜索失败：${String(error?.message || error)}`;
      renderPanel();
    }
  }

  /** 切换到指定来源：沿用同名线路（没有就用第一条），集数超出时回到第 1 集，并恢复当前进度。 */
  async function switchTo(entry) {
    const current = player();
    const vod = current.vod;
    const bridge = window.__cineflowVod;
    if (!vod || !bridge) return;
    const row = panel.querySelector(`[data-cf-source="${CSS.escape(candidateKey(entry))}"]`);
    if (row) row.querySelector('small').textContent = '正在切换…';
    let detail = entry.detail;
    if (!detail) {
      try {
        detail = await bridge.detail(entry.sourceKey, entry.vodId);
      } catch (error) {
        detail = { ok: false, error: String(error?.message || error) };
      }
    }
    if (!detail?.ok) {
      entry.failed = true;
      entry.error = detail?.error || '不可用';
      renderPanel();
      return;
    }
    const sameLine = detail.lines.findIndex((line) => line.name === vod.lineName);
    const lineIndex = sameLine >= 0 ? sameLine : 0;
    const episodes = detail.lines[lineIndex].episodes.length;
    const episodeIndex = Number(current.episodeIndex) < episodes ? Number(current.episodeIndex) : 0;
    const keepTime = episodeIndex === Number(current.episodeIndex) ? art.template.$video.currentTime : 0;
    pendingStart = keepTime > 3 ? { loadId: current.loadId + 1, time: keepTime } : null;
    const alternatives = panelState.candidates
      .filter((candidate) => !candidate.failed)
      .map(({ sourceKey, vodId, sourceName, ms }) => ({ sourceKey, vodId, sourceName, ms }));
    closeSourcePanel();
    bridge.play({
      group: { name: vod.title, year: vod.year, pic: vod.pic },
      item: { sourceKey: entry.sourceKey, vodId: entry.vodId, sourceName: entry.sourceName },
      detail,
      lineIndex,
      episodeIndex,
      alternatives
    });
    panelState.key = `${entry.sourceKey}:${entry.vodId}`;
    for (const candidate of panelState.candidates) candidate.current = candidateKey(candidate) === panelState.key;
    if (episodeIndex !== Number(current.episodeIndex)) toast?.(`新来源只有 ${episodes} 集，已从第 1 集开始`);
  }

  panel.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('.cf-source-close')) return closeSourcePanel();
    if (target?.closest('.cf-source-more')) return searchMoreSources();
    const row = target?.closest('[data-cf-source]');
    if (!row) return;
    const entry = panelState.candidates.find((candidate) => candidateKey(candidate) === row.getAttribute('data-cf-source'));
    if (entry && !entry.current && !entry.failed) switchTo(entry);
  });

  // renderer 的 setPlayerError 在所有回退都失败后派发该事件：有其它来源时自动弹出换源面板
  window.addEventListener('cineflow:player-error', () => {
    if (!player().open || !player().vod) return;
    openSourcePanel('当前来源播放失败，请换一个来源（会保留集数）。');
  });

  // 关闭播放器时收起面板与提示
  const modal = document.querySelector('#playerModal');
  if (modal) {
    new MutationObserver(() => {
      if (!modal.classList.contains('is-open')) {
        closeSourcePanel();
        undoLayer.classList.add('is-hidden');
        window.clearTimeout(nextTimer);
        if (art.fullscreen) art.fullscreen = false;
      } else {
        syncControls();
      }
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  syncControls();
  return { art, openSourcePanel, closeSourcePanel };
}
