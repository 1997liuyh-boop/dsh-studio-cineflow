// v3.4.0 纯增量：断点续播（"接着看"直达具体播放源与上次进度）
// 全部走基线已有的 DOM 契约：点行内的隐藏 .movie-card 打开介绍页 → 等 #resourceResults 轮询出资源卡 →
// 点记录里那条线路/那一集的 [data-play-url] → 播放器就绪后把 currentTime 拨回上次看到的秒数。
// 不改基线一行代码；任何一步失败都只是停在原地（介绍页或播放器开头），并给一条短提示。

const DETAIL_WAIT_MS = 6000;
const RESOURCE_WAIT_MS = 20000; // 资源是边轮询边追加的，给足时间
const PLAYER_WAIT_MS = 15000;
const SEEK_WAIT_MS = 25000;
const POLL_MS = 250;

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function detailOpen() {
  return Boolean(document.querySelector('#detailPanel')?.classList.contains('is-open'));
}

function playerOpen() {
  return Boolean(document.querySelector('#playerModal')?.classList.contains('is-open'));
}

function resourceList() {
  return document.querySelector('#resourceResults');
}

function videoEl() {
  return document.querySelector('#resourcePlayer');
}

function textOf(node) {
  return (node?.textContent || '').replace(/\s+/g, ' ').trim();
}

function notify(message) {
  const el = document.querySelector('#toast');
  if (!el || !message) return;
  el.textContent = message;
  el.classList.remove('is-hidden');
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => el.classList.add('is-hidden'), 2600);
}

// 资源卡按"源名相同者优先"排序；卡内按钮再按线路名、集数标签逐级匹配，匹配不到就退回该卡第一个可播按钮
function pickPlayButton(item) {
  const list = resourceList();
  if (!list) return null;
  const cards = [...list.querySelectorAll('.resource-card')];
  if (!cards.length) return null;
  const cardsRanked = cards
    .map((card, index) => {
      const source = textOf(card.querySelector('.resource-card-head strong'));
      return { card, index, rank: item.sourceName && source === item.sourceName ? 0 : 1 };
    })
    .sort((a, b) => a.rank - b.rank || a.index - b.index);
  let fallback = null;
  let lineHit = null;
  for (const { card } of cardsRanked) {
    const buttons = [...card.querySelectorAll('[data-play-url]')];
    for (const button of buttons) {
      const line = button.getAttribute('data-player-line') || '';
      const label = button.getAttribute('data-player-label') || '';
      if (item.label && label === item.label && (!item.lineName || line === item.lineName)) return { button, exact: true };
      if (!lineHit && item.lineName && line === item.lineName) lineHit = { button, exact: false };
      if (!fallback) fallback = { button, exact: false };
    }
  }
  return lineHit || fallback;
}

// 播放器内的整集列表比资源卡里可见的前 12 集更全，落点不对时在这里补一次切集
function pickEpisodeButton(item) {
  const buttons = [...document.querySelectorAll('.player-episode-button')];
  if (!buttons.length) return null;
  const byLabel = item.label
    ? buttons.find((button) => (button.getAttribute('title') || '').trim() === item.label)
    : null;
  if (byLabel) return byLabel;
  if (Number.isFinite(Number(item.episodeIndex)) && Number(item.episodeIndex) > 0) {
    const byIndex = buttons.find((button) => Number(button.dataset.playerEpisodeIndex) === Number(item.episodeIndex));
    if (byIndex && (!item.label || (byIndex.getAttribute('title') || '').includes(item.label))) return byIndex;
  }
  return null;
}

async function waitFor(check, timeoutMs, isCancelled) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (isCancelled()) return null;
    const value = check();
    if (value) return value;
    if (resourceList()?.querySelector('.resource-empty')) return null;
    await sleep(POLL_MS);
  }
  return null;
}

async function seekTo(target, isCancelled) {
  const deadline = Date.now() + SEEK_WAIT_MS;
  while (Date.now() < deadline) {
    if (isCancelled()) return false;
    const video = videoEl();
    if (video && playerOpen()) {
      const duration = Number(video.duration) || 0;
      if (duration > 0 && duration <= target + 2) {
        // 这个源比上次看的短（换了线路或集数不同），不硬跳，从头播
        return false;
      }
      if (duration > 0 && video.readyState >= 1) {
        try {
          video.currentTime = target;
        } catch (error) {
          /* 尚未可 seek，下一轮再试 */
        }
        await sleep(400);
        const now = Number(video.currentTime) || 0;
        if (Math.abs(now - target) <= Math.max(3, target * 0.02)) {
          video.play?.().catch(() => {});
          return true;
        }
      }
    }
    await sleep(POLL_MS);
  }
  return false;
}

export function createHistoryResume({ state } = {}) {
  let runId = 0;

  // v0.3.0：采集站记录直接取上次来源的详情播放，不再模拟点击介绍页
  async function resumeVod(item, cancelled) {
    const bridge = window.__cineflowVod;
    const vod = item.vod || {};
    if (!bridge?.detail || !vod.sourceKey || !vod.vodId) return false;
    let detail = null;
    try {
      detail = await bridge.detail(vod.sourceKey, vod.vodId);
    } catch {
      detail = null;
    }
    if (cancelled()) return false;
    if (!detail?.ok) {
      notify('上次的来源暂时不可用，已打开作品页，请换一个来源');
      bridge.openByTitle?.(item.title, item.year);
      return false;
    }
    const byName = detail.lines.findIndex((line) => line.name === vod.lineName);
    const lineIndex = byName >= 0 ? byName : Math.min(Number(vod.lineIndex) || 0, detail.lines.length - 1);
    const episodes = detail.lines[lineIndex].episodes;
    const byLabel = item.label ? episodes.findIndex((episode) => episode.label === item.label) : -1;
    const episodeIndex = byLabel >= 0 ? byLabel : Math.min(Number(item.episodeIndex) || 0, episodes.length - 1);
    bridge.play({
      group: { name: item.title, year: item.year, pic: item.poster },
      item: { sourceKey: vod.sourceKey, vodId: vod.vodId, sourceName: vod.sourceName || item.sourceName },
      detail,
      lineIndex,
      episodeIndex
    });
    if (!(await waitFor(playerOpen, PLAYER_WAIT_MS, cancelled))) return false;
    const progress = Number(item.progress) || 0;
    if (!progress) return true;
    const ok = await seekTo(progress, cancelled);
    if (!ok && state?.player?.open && !cancelled()) notify('已从头开始播放');
    return ok;
  }

  async function resume(item, trigger) {
    if (!item) return false;
    const my = ++runId;
    const cancelled = () => my !== runId;
    if (item.mediaType === 'vod') return resumeVod(item, cancelled);
    if (!trigger) return false;

    trigger.click();
    if (!(await waitFor(detailOpen, DETAIL_WAIT_MS, cancelled))) {
      notify('没能打开介绍页');
      return false;
    }
    // 新版介绍页的片源改为采集站作品列表，旧记录无法定位到具体按钮时停在介绍页让用户选择
    const picked = await waitFor(() => pickPlayButton(item) || (resourceList()?.querySelector('.vod-match-list') ? 'vod' : null), RESOURCE_WAIT_MS, cancelled);
    if (cancelled()) return false;
    if (picked === 'vod') {
      notify('已打开介绍页，请在「可用资源」中选择来源继续播放');
      return false;
    }
    if (!picked) {
      notify('没找到上次的播放源');
      return false;
    }
    picked.button.click();
    if (!(await waitFor(playerOpen, PLAYER_WAIT_MS, cancelled))) {
      notify('这个源没能打开播放器');
      return false;
    }
    if (item.mediaType === 'tv' && !picked.exact) {
      const episode = await waitFor(() => pickEpisodeButton(item), 4000, cancelled);
      if (cancelled()) return false;
      if (episode) {
        episode.click();
        await waitFor(playerOpen, PLAYER_WAIT_MS, cancelled);
      }
    }
    const progress = Number(item.progress) || 0;
    if (!progress) return true;
    const ok = await seekTo(progress, cancelled);
    if (cancelled()) return false;
    if (!ok && state?.player?.open) notify('已从头开始播放');
    return ok;
  }

  return {
    resume,
    cancel() {
      runId += 1;
    },
  };
}
