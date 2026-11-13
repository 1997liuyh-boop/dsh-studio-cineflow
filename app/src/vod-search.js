// 采集站优先的聚合搜索（渲染层）：分批并发搜索、渐进式聚合、作品面板（来源 / 线路 / 选集）。
// 搜索与聚合规则与主进程共用 electron/vod-core.mjs。

import { aggregateResults, normalizeTitle, prepareQuery } from '../electron/vod-core.mjs';

const SOURCE_CACHE_MS = 60 * 1000;
const BATCH_SIZE = 4; // 每次 IPC 搜索的源数量
const BATCH_CONCURRENCY = 4; // 同时在途的批次数
const DETAIL_CONCURRENCY = 4; // 作品面板同时拉取详情的来源数
const EPISODE_PAGE = 100; // 选集超过该数量时分段显示

/** 采集站搜索引擎：把源切成小批并发搜索，每批返回就回调一次，实现渐进式结果。 */
export function createVodSearchEngine(vodApi) {
  let sourceCache = { at: 0, list: [] };

  async function listSources(force = false) {
    if (!force && Date.now() - sourceCache.at < SOURCE_CACHE_MS && sourceCache.list.length) return sourceCache.list;
    const list = await vodApi.sources();
    sourceCache = { at: Date.now(), list: Array.isArray(list) ? list : [] };
    return sourceCache.list;
  }

  /**
   * 执行一次搜索。
   * onProgress({ items, groups, checked, total, failures, done }) 在每批完成后调用；
   * isCurrent() 返回 false 时停止后续回调（用户已换词）。
   */
  async function run(query, { onProgress, isCurrent = () => true } = {}) {
    const sources = (await listSources()).filter((source) => !source.disabled);
    const total = sources.length;
    const batches = [];
    for (let index = 0; index < sources.length; index += BATCH_SIZE) {
      batches.push(sources.slice(index, index + BATCH_SIZE).map((source) => source.key));
    }
    const items = [];
    const failures = [];
    let checked = 0;
    let cursor = 0;
    const disabledEvents = [];
    const emit = (done) => {
      if (!isCurrent()) return;
      onProgress?.({ items, groups: aggregateResults(items, query), checked, total, failures, done, disabledEvents });
    };
    const worker = async () => {
      while (cursor < batches.length && isCurrent()) {
        const keys = batches[cursor++];
        try {
          const result = await vodApi.search(query, keys);
          for (const outcome of result?.outcomes || []) {
            if (outcome.ok) items.push(...(outcome.list || []));
            else failures.push({ key: outcome.key, name: outcome.name, error: outcome.error, timedOut: outcome.timedOut });
          }
          disabledEvents.push(...(result?.disabledEvents || []));
        } catch (error) {
          for (const key of keys) failures.push({ key, name: key, error: String(error?.message || error) });
        }
        checked += keys.length;
        emit(false);
      }
    };
    await Promise.all(Array.from({ length: Math.min(BATCH_CONCURRENCY, batches.length) }, worker));
    // 有源被自动停用时刷新源列表缓存
    if (disabledEvents.length) sourceCache.at = 0;
    emit(true);
    return { items, groups: aggregateResults(items, query), checked, total, failures };
  }

  return { run, listSources, invalidate: () => { sourceCache.at = 0; } };
}

/** 按 TMDB 作品筛选、排序聚合组：片名完全相同、年份一致的排前面。 */
export function rankGroupsForTitle(groups, { title, originalTitle, year, mediaType } = {}) {
  const targets = [title, originalTitle].map(normalizeTitle).filter(Boolean);
  return groups
    .filter((group) => !group.noise)
    .map((group) => {
      const name = normalizeTitle(group.name);
      let score = 0;
      if (targets.includes(name)) score += 6;
      else if (targets.some((target) => name.startsWith(target))) score += mediaType === 'tv' ? 3 : 1;
      if (year && group.year === String(year)) score += 4;
      else if (year && group.year && Math.abs(Number(group.year) - Number(year)) <= 1) score += 2;
      score += Math.min(3, group.sourceCount / 6);
      return { group, score };
    })
    .filter((entry) => entry.score >= 1)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.group);
}

/** 聚合卡片 HTML（沿用首页卡片的视觉结构，点击由 data-vod-key 委托处理）。 */
export function renderVodCard(group, escapeHtml) {
  const meta = [group.year, group.typeName, group.area].filter(Boolean).join(' · ');
  return `
    <article class="movie-card vod-card${group.noise ? ' is-noise' : ''}" tabindex="0" data-vod-key="${escapeHtml(group.key)}">
      <div class="poster-frame">
        ${group.pic ? `<img src="${escapeHtml(group.pic)}" alt="${escapeHtml(group.name)} 海报" loading="lazy" decoding="async" referrerpolicy="no-referrer" />` : '<div class="poster-fallback">暂无海报</div>'}
        <div class="score-pill">${group.sourceCount} 个来源${group.remarks ? ` · ${escapeHtml(group.remarks)}` : ''}</div>
      </div>
      <h3>${escapeHtml(group.name)}</h3>
      <p>${escapeHtml(meta || '采集站资源')}</p>
    </article>
  `;
}

function formatMs(ms) {
  if (!Number.isFinite(ms)) return '';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} 秒` : `${Math.round(ms)} 毫秒`;
}

/**
 * 作品面板：列出一个聚合组的全部来源，并发拉取详情（耗时即测速），
 * 选中来源后展示线路与选集；点击选集回调 onPlay。
 */
export function createVodWorkView({ vodApi, escapeHtml, onPlay, onMeta }) {
  /** 在 container 内渲染作品的来源 / 线路 / 选集区域。返回 { destroy }。 */
  function renderWork(container, group, { preferSourceKey = '' } = {}) {
    let alive = true;
    const items = [...group.items];
    const results = new Map(); // `${sourceKey}:${vodId}` → 详情结果
    let selected = null;
    let manual = false;
    let lineIndex = 0;
    let episodePage = 0;
    const keyOf = (item) => `${item.sourceKey}:${item.vodId}`;

    container.innerHTML = `
      <div class="vod-work">
        <div class="vod-work-head">
          <h4>播放来源</h4>
          <span class="vod-work-status">正在测速 0/${items.length}</span>
        </div>
        <div class="vod-source-list" role="listbox" aria-label="播放来源"></div>
        <div class="vod-line-tabs" role="tablist" aria-label="线路"></div>
        <div class="vod-episode-pages"></div>
        <div class="vod-episodes"></div>
      </div>
    `;
    const sourceList = container.querySelector('.vod-source-list');
    const lineTabs = container.querySelector('.vod-line-tabs');
    const pageTabs = container.querySelector('.vod-episode-pages');
    const episodesEl = container.querySelector('.vod-episodes');
    const statusEl = container.querySelector('.vod-work-status');

    const sortedItems = () => [...items].sort((a, b) => {
      const ra = results.get(keyOf(a));
      const rb = results.get(keyOf(b));
      const sa = ra ? (ra.ok ? 0 : 2) : 1;
      const sb = rb ? (rb.ok ? 0 : 2) : 1;
      return sa - sb || (ra?.ms ?? 1e9) - (rb?.ms ?? 1e9);
    });

    function renderSources() {
      sourceList.innerHTML = sortedItems().map((item) => {
        const result = results.get(keyOf(item));
        const isSelected = selected && keyOf(selected) === keyOf(item);
        let info = '测速中…';
        let tone = 'pending';
        if (result?.ok) {
          const episodes = Math.max(...result.lines.map((line) => line.episodes.length));
          info = `${formatMs(result.ms)} · ${result.lines.length} 条线路 · ${episodes} 集`;
          tone = result.ms > 2000 ? 'slow' : 'ok';
        } else if (result) {
          info = result.error || '不可用';
          tone = 'failed';
        }
        return `
          <button class="vod-source-chip is-${tone}${isSelected ? ' is-active' : ''}" type="button" role="option" aria-selected="${isSelected ? 'true' : 'false'}" data-vod-source="${escapeHtml(keyOf(item))}" ${result && !result.ok ? 'disabled' : ''}>
            <strong>${escapeHtml(item.sourceName)}</strong>
            <small>${escapeHtml(info)}</small>
            ${item.remarks ? `<em>${escapeHtml(item.remarks)}</em>` : ''}
          </button>
        `;
      }).join('');
    }

    function renderEpisodes() {
      const result = selected ? results.get(keyOf(selected)) : null;
      if (!result?.ok) {
        lineTabs.innerHTML = '';
        pageTabs.innerHTML = '';
        episodesEl.innerHTML = `<div class="resource-pulse">${results.size < items.length ? '正在获取剧集列表…' : '所有来源都暂时不可用，请稍后重试或换一个作品。'}</div>`;
        return;
      }
      lineIndex = Math.min(lineIndex, result.lines.length - 1);
      lineTabs.innerHTML = result.lines.map((line, index) => `
        <button class="vod-line-tab${index === lineIndex ? ' is-active' : ''}" type="button" role="tab" aria-selected="${index === lineIndex}" data-vod-line="${index}">
          ${escapeHtml(line.name)} · ${line.episodes.length} 集${line.episodes[0]?.format ? ` · ${escapeHtml(line.episodes[0].format)}` : ''}
        </button>
      `).join('');
      const episodes = result.lines[lineIndex].episodes;
      const pageCount = Math.ceil(episodes.length / EPISODE_PAGE);
      episodePage = Math.min(episodePage, pageCount - 1);
      pageTabs.innerHTML = pageCount > 1 ? Array.from({ length: pageCount }, (_, index) => {
        const start = index * EPISODE_PAGE + 1;
        const end = Math.min(episodes.length, (index + 1) * EPISODE_PAGE);
        return `<button class="vod-page-tab${index === episodePage ? ' is-active' : ''}" type="button" data-vod-page="${index}">${start}-${end}</button>`;
      }).join('') : '';
      const offset = episodePage * EPISODE_PAGE;
      episodesEl.innerHTML = episodes.slice(offset, offset + EPISODE_PAGE).map((episode, index) => `
        <button class="resource-episode vod-episode" type="button" data-vod-episode="${offset + index}" title="${escapeHtml(episode.label)}">
          <span class="resource-episode-label">${escapeHtml(episode.label)}</span>
        </button>
      `).join('');
    }

    function select(item, byUser = false) {
      selected = item;
      if (byUser) manual = true;
      lineIndex = 0;
      episodePage = 0;
      renderSources();
      renderEpisodes();
      const result = results.get(keyOf(item));
      if (result?.ok) onMeta?.(result.meta, group);
    }

    container.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const sourceButton = target?.closest('[data-vod-source]');
      if (sourceButton) {
        const item = items.find((entry) => keyOf(entry) === sourceButton.getAttribute('data-vod-source'));
        if (item) select(item, true);
        return;
      }
      const lineButton = target?.closest('[data-vod-line]');
      if (lineButton) {
        lineIndex = Number(lineButton.getAttribute('data-vod-line')) || 0;
        episodePage = 0;
        renderEpisodes();
        return;
      }
      const pageButton = target?.closest('[data-vod-page]');
      if (pageButton) {
        episodePage = Number(pageButton.getAttribute('data-vod-page')) || 0;
        renderEpisodes();
        return;
      }
      const episodeButton = target?.closest('[data-vod-episode]');
      if (episodeButton && selected) {
        const result = results.get(keyOf(selected));
        if (!result?.ok) return;
        onPlay?.({
          group,
          item: selected,
          detail: result,
          lineIndex,
          episodeIndex: Number(episodeButton.getAttribute('data-vod-episode')) || 0,
          // 同一作品其它可用来源，供播放器内换源使用
          alternatives: items.filter((entry) => results.get(keyOf(entry))?.ok).map((entry) => ({ item: entry, detail: results.get(keyOf(entry)) }))
        });
      }
    });

    renderSources();
    renderEpisodes();

    // 并发拉取详情：耗时即测速；第一个成功的来源自动选中（指定了优先来源时优先选它）
    let cursor = 0;
    const queue = [...items].sort((a, b) => Number(b.sourceKey === preferSourceKey) - Number(a.sourceKey === preferSourceKey));
    const worker = async () => {
      while (alive && cursor < queue.length) {
        const item = queue[cursor++];
        let result;
        try {
          result = await vodApi.detail(item.sourceKey, item.vodId);
        } catch (error) {
          result = { ok: false, error: String(error?.message || error) };
        }
        if (!alive) return;
        results.set(keyOf(item), result || { ok: false, error: '无响应' });
        statusEl.textContent = results.size < items.length ? `正在测速 ${results.size}/${items.length}` : `${[...results.values()].filter((entry) => entry.ok).length}/${items.length} 个来源可用 · 已按速度排序`;
        if (result?.ok && !manual && (!selected || (preferSourceKey && item.sourceKey === preferSourceKey))) {
          select(item);
        } else {
          renderSources();
          if (!selected && results.size === items.length) renderEpisodes();
        }
      }
    };
    Promise.all(Array.from({ length: Math.min(DETAIL_CONCURRENCY, queue.length) }, worker)).then(() => {
      if (alive && !selected) renderEpisodes();
    });

    return {
      destroy() { alive = false; },
      results
    };
  }

  /** TMDB 详情页的「可用资源」：先列出匹配到的作品，选中后展示来源与选集。 */
  function renderMatches(container, groups, { selectedKey = '' } = {}) {
    let current = null;
    container.innerHTML = `
      <div class="vod-match-list" role="tablist" aria-label="匹配作品">
        ${groups.map((group) => `
          <button class="vod-match-chip${group.key === selectedKey ? ' is-active' : ''}" type="button" role="tab" data-vod-match="${escapeHtml(group.key)}">
            ${escapeHtml(group.name)}${group.year ? ` · ${escapeHtml(group.year)}` : ''}<small>${group.sourceCount} 个来源</small>
          </button>
        `).join('')}
      </div>
      <div class="vod-match-body"></div>
    `;
    const body = container.querySelector('.vod-match-body');
    const choose = (key) => {
      const group = groups.find((entry) => entry.key === key);
      if (!group) return;
      container.querySelectorAll('[data-vod-match]').forEach((button) => button.classList.toggle('is-active', button.getAttribute('data-vod-match') === key));
      current?.destroy();
      current = renderWork(body, group);
    };
    container.querySelector('.vod-match-list').addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest('[data-vod-match]') : null;
      if (button) choose(button.getAttribute('data-vod-match'));
    });
    if (groups.length) choose(selectedKey || groups[0].key);
    return { destroy: () => current?.destroy() };
  }

  return { renderWork, renderMatches };
}

/** 精确片名模式：只保留归一化后与查询完全相同的组。 */
export function exactGroups(groups, query) {
  const target = prepareQuery(query).normalized;
  return groups.filter((group) => normalizeTitle(group.name) === target);
}
