// v3.4.0 纯增量：分类片库页
// 卡片复用基线 .movie-card 结构与 data-content-key 约定，点击仍由基线事件委托打开介绍页。
// 地区、类别和发布时间在顶部组合筛选，复用既有 tmdb:discover 与详情链路。
// 第九轮：加载更多照搬首页那套（railState 的 page/loading/hasMore + 去重合并 + 一页不足 18 条即到底 +
// 距底 420px 触发），滚轮往下滑会一直续拉，不再有 8 页上限。
// 第十轮：首页"电影/节目风格入口"已从界面去掉，标签真源改成 state.genres（TMDB 电影+节目类型全集），
// 顺序照 classification.png 的"类型"行排；标签只留分类文字；2000 年之前统一归进"2000~"一个标签。
// 第十八轮：无 TMDB 凭证（或 TMDB 整页失败）时改用豆瓣热门片单兜底，卡片带 data-cf8-douban，
// 点击由 douban-fallback 接管弹出豆瓣资料卡（播放仍需 TMDB 凭证，不给假按钮）。
// 第二十七轮：滚动改到内层 .cf3-scroll，"热度 / 回到顶部"两枚固定按钮留在不滚动的页面上，
// 因为 cf3-warm 的常驻 will-change 会让滚动的 .cf3-page 变成 fixed 后代的包含块（按钮跟着滚走）。
import { fetchDoubanMovies } from './douban-fallback.js';

const SORTS = [
  { id: 'popularity', label: '热度', movie: 'popularity.desc', tv: 'popularity.desc' },
  { id: 'rating', label: '评分', movie: 'vote_average.desc', tv: 'vote_average.desc' },
  { id: 'latest', label: '最新', movie: 'primary_release_date.desc', tv: 'first_air_date.desc' },
  { id: 'oldest', label: '最早', movie: 'primary_release_date.asc', tv: 'first_air_date.asc' },
];
const MEDIA_TABS = [
  { id: 'all', label: '全部' },
  { id: 'movie', label: '电影' },
  { id: 'tv', label: '节目' },
];
const REGIONS = [
  { id: '', label: '全部地区' },
  { id: 'CN', label: '中国大陆' },
  { id: 'HK', label: '中国香港' },
  { id: 'TW', label: '中国台湾' },
  { id: 'US', label: '美国' },
  { id: 'JP', label: '日本' },
  { id: 'KR', label: '韩国' },
  { id: 'GB', label: '英国' },
  { id: 'FR', label: '法国' },
  { id: 'DE', label: '德国' },
  { id: 'IN', label: '印度' },
  { id: 'TH', label: '泰国' },
  { id: 'CA', label: '加拿大' },
  { id: 'AU', label: '澳大利亚' },
  { id: 'ES', label: '西班牙' },
  { id: 'IT', label: '意大利' },
];
const STYLE_ORDER = ['喜剧', '爱情', '恐怖', '动作', '科幻', '剧情', '犯罪', '奇幻', '悬疑', '惊悚', '家庭', '冒险', '动画', '纪录', '历史', '音乐', '战争', '西部', '儿童', '新闻', '真人秀', '脱口秀'];
const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const POSTER_SIZE = 'w342';
// 与基线 maybeAutoLoadMore / loadMoreRail 同一组数字：距底 420px 就续拉，一页返回不足 18 条视为到底
const LOAD_MORE_THRESHOLD_PX = 420;
const FULL_PAGE_SIZE = 18;
const SKELETON_COUNT = 8;
const PRE_2000 = 'pre2000';

function styleOrderIndex(name) {
  const index = STYLE_ORDER.findIndex((item) => String(name || '').includes(item));
  return index === -1 ? 99 : index;
}

function normalizeGenreName(name) {
  return String(name || '').replace(/片$/, '').trim();
}

// state.genres 是主进程合并 TMDB 电影与节目两个 /genre 端点的结果；节目侧的"科幻与奇幻""战争与政治"
// 这类复合名在电影侧已有对应单基标签，跳过它们以免同一含义出现两个胶囊。
function collectGenres(state) {
  const genres = Array.isArray(state?.genres) ? state.genres : [];
  const picked = [];
  for (const genre of genres) {
    const raw = String(genre?.name || '').trim();
    const label = normalizeGenreName(raw);
    if (!label || /与|\/|&/.test(raw)) continue;
    if (!Number.isFinite(Number(genre.id))) continue;
    if (picked.some((item) => item.label === label)) continue;
    picked.push({ id: Number(genre.id), label, name: label });
  }
  return picked.sort((a, b) => styleOrderIndex(a.label) - styleOrderIndex(b.label));
}

function posterOf(path) {
  if (!path) return '';
  const value = String(path);
  if (/^(https?:|data:)/i.test(value)) return value; // 豆瓣兜底海报是绝对地址
  return `${IMAGE_BASE}/${POSTER_SIZE}${path}`;
}

function scoreOf(movie) {
  return Number(movie.voteAverage || 0).toFixed(1);
}

function rememberMovie(state, movie) {
  const mediaType = movie.mediaType === 'tv' ? 'tv' : 'movie';
  const key = `${mediaType}:${movie.id}`;
  if (!movie.cf8Douban) {
    try {
      if (state?.cardMovies?.set) state.cardMovies.set(key, movie);
    } catch (error) {
      /* Map 不可用时卡片点击只是打不开详情，页面本身不受影响 */
    }
  }
  return key;
}

function buildCard(movie, state, escapeHtml) {
  const key = rememberMovie(state, movie);
  const card = document.createElement('article');
  card.className = 'movie-card';
  card.tabIndex = 0;
  card.dataset.movieId = String(movie.id);
  card.dataset.mediaType = movie.mediaType === 'tv' ? 'tv' : 'movie';
  card.dataset.contentKey = key;
  if (movie.cf8Douban) {
    card.dataset.cf8Douban = '1';
    card.__cf8Item = {
      id: movie.cf8Id || movie.id,
      title: movie.title,
      mediaType: movie.mediaType === 'tv' ? 'tv' : 'movie',
      cover: movie.cf8Cover || movie.posterPath || '',
      rating: movie.cf8Rating || ''
    };
  }
  const poster = posterOf(movie.posterPath);
  const year = String(movie.releaseDate || '').slice(0, 4);
  card.innerHTML = `
    <div class="poster-frame">
      ${poster ? `<img src="${poster}" alt="${escapeHtml(movie.title)} 海报" decoding="async" fetchpriority="low" />` : '<div class="poster-fallback">No Poster</div>'}
      <div class="score-pill">★ ${scoreOf(movie)} · ${card.dataset.mediaType === 'tv' ? '节目' : '电影'}</div>
    </div>
    <h3>${escapeHtml(movie.title)}</h3>
    <p>${escapeHtml(year || '未知年份')}</p>
  `;
  return card;
}

// 年份筛选的三种形态：不限 / 单一年份 / "2000~"（上界 1999-12-31，走 tmdb:discover 的 yearTo 透传）
function yearQuery(year) {
  if (year === PRE_2000) return { yearTo: '1999-12-31' };
  if (year) return { year };
  return {};
}

async function fetchTmdbPage(api, { genre, media, sort, year, region, dateFrom, dateTo, page }) {
  const movieSort = sort.movie;
  const tvSort = sort.tv;
  const filters = {
    ...yearQuery(year === 'custom' ? null : year),
    originCountry: region || undefined,
    releaseDateFrom: year === 'custom' ? dateFrom || undefined : undefined,
    releaseDateTo: year === 'custom' ? dateTo || undefined : undefined,
    minVotes: sort.id === 'rating' ? 50 : 0,
  };
  if (media !== 'all') {
    return api.discoverMovies({
      mediaType: media,
      genreId: genre ? genre.id : undefined,
      sortBy: media === 'tv' ? tvSort : movieSort,
      ...filters,
      page,
    });
  }
  // 分别使用电影首映和节目首播字段，再按同一规则合并，避免混排时某一类被截掉。
  const [movies, shows] = await Promise.all([
    api.discoverMovies({ mediaType: 'movie', genreId: genre?.id, sortBy: movieSort, ...filters, page }),
    api.discoverMovies({ mediaType: 'tv', genreId: genre?.id, sortBy: tvSort, ...filters, page }),
  ]);
  const valueOf = sort.id === 'rating'
    ? (item) => item.voteAverage || 0
    : sort.id === 'popularity' ? (item) => item.popularity || 0 : (item) => item.releaseDate || '';
  const direction = sort.id === 'oldest' ? 1 : -1;
  return [...(movies || []), ...(shows || [])].sort((a, b) => {
    const first = valueOf(a);
    const second = valueOf(b);
    return (first < second ? -1 : first > second ? 1 : 0) * direction;
  });
}

// 第十八轮：TMDB 整页失败（含无凭证）时改用豆瓣热门片单；豆瓣也拿不到才把原错误抛回去
async function fetchPage(api, query) {
  try {
    return await fetchTmdbPage(api, query);
  } catch (error) {
    // 公开热门片单无法准确按地区和日期筛选，失败时明确提示，避免拿不匹配的内容充数。
    if (query.region || query.year || query.sort.id !== 'popularity') throw error;
    const fallback = await fetchDoubanMovies(query).catch(() => []);
    if (fallback.length) return fallback;
    throw error;
  }
}

export function createLibraryPage({ api, state, escapeHtml = (value) => String(value ?? '') } = {}) {
  const view = document.createElement('div');
  view.className = 'cf3-page cf3-library';
  let genres = collectGenres(state);
  const currentYear = new Date().getFullYear();
  // 逐年只列到 2000，更早的统一成一档"2000~"
  const yearEntries = [
    { year: null, label: '不限' },
    ...Array.from({ length: currentYear - 1999 }, (_, index) => ({ year: currentYear - index, label: String(currentYear - index) })),
    { year: PRE_2000, label: '2000 年以前' },
    { year: 'custom', label: '自定义日期范围' },
  ];

  // 筛选和片单共用内部滚动容器，回到顶部按钮固定在页面上。
  view.innerHTML = `
    <div class="cf3-scroll">
      <header class="cf3-head">
        <p class="eyebrow">LIBRARY</p>
        <div class="cf3-heading-row">
          <h2 class="cf3-title">分类片库</h2>
          <button class="cf3-chip cf3-reset" type="button">重置筛选</button>
        </div>
        <p class="cf3-filter-help">组合选择地区、类别和发布时间，发现想看的电影与节目。</p>
        <div class="cf3-media cf3-no-drag" role="group" aria-label="媒体类型"></div>
      </header>
      <div class="cf3-criteria cf3-no-drag">
        <div class="cf3-filter"><span class="cf3-filter-label">地区</span><div class="cf3-option-row cf3-region-row" role="group" aria-label="地区"></div></div>
        <div class="cf3-filter"><span class="cf3-filter-label">时间</span><div class="cf3-option-row cf3-year-row" role="group" aria-label="发布时间"></div></div>
        <div class="cf3-filter"><span class="cf3-filter-label">排序</span><div class="cf3-option-row cf3-sort-row" role="group" aria-label="排序"></div></div>
      </div>
      <form class="cf3-date-range cf3-no-drag" hidden>
        <label class="cf3-field">开始日期<input class="cf3-date-from" type="date" aria-label="开始日期" /></label>
        <span class="cf3-date-separator">至</span>
        <label class="cf3-field">结束日期<input class="cf3-date-to" type="date" aria-label="结束日期" /></label>
        <button class="cf3-chip" type="submit">应用日期</button>
        <p class="cf3-date-error" role="alert" hidden></p>
      </form>
      <div class="cf3-filter">
        <span class="cf3-filter-label">类别</span>
        <div class="cf3-styles cf3-no-drag" role="group" aria-label="风格分类"></div>
      </div>
      <p class="cf3-filter-summary" role="status"></p>
      <div class="cf3-grid" aria-live="polite"></div>
      <div class="cf3-foot">
        <button class="rail-more-button cf3-more" type="button" hidden>加载更多</button>
      </div>
    </div>
    <button class="cf3-totop cf3-no-drag" type="button" title="回到顶部" aria-label="回到顶部">
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 16V5" /><path d="M5.5 9.5 10 5l4.5 4.5" /></svg>
    </button>
  `;

  const scroller = view.querySelector('.cf3-scroll');
  const mediaRow = view.querySelector('.cf3-media');
  const styleRow = view.querySelector('.cf3-styles');
  const grid = view.querySelector('.cf3-grid');
  const moreBtn = view.querySelector('.cf3-more');
  const toTop = view.querySelector('.cf3-totop');
  const regionRow = view.querySelector('.cf3-region-row');
  const yearRow = view.querySelector('.cf3-year-row');
  const sortRow = view.querySelector('.cf3-sort-row');
  const dateRange = view.querySelector('.cf3-date-range');
  const dateFromInput = view.querySelector('.cf3-date-from');
  const dateToInput = view.querySelector('.cf3-date-to');
  const dateError = view.querySelector('.cf3-date-error');
  const summary = view.querySelector('.cf3-filter-summary');

  const query = { genre: null, media: 'all', sort: SORTS[0], year: null, region: '', dateFrom: '', dateTo: '' };
  let customDatesOpen = false;
  const cache = new Map();
  const seen = new Set(); // 跨页去重，跟首页 uniqueMovies 一个意思
  let page = 1;
  let token = 0;
  let loading = false;
  let failedReset = false;
  let hasMore = true;
  let loadedEpoch = ''; // 这一页当前是用哪个数据源渲染的（无凭证=豆瓣 / 有凭证=TMDB）

  function chips(row, entries, isActive, onPick, makeChip) {
    const scrollLeft = row.scrollLeft;
    const focusedIndex = [...row.children].indexOf(document.activeElement);
    row.innerHTML = '';
    entries.forEach((entry) => {
      const button = makeChip ? makeChip(entry) : document.createElement('button');
      if (!makeChip) {
        button.type = 'button';
        button.className = 'cf3-chip';
        button.textContent = entry.label;
      }
      button.classList.toggle('is-on', Boolean(isActive(entry)));
      button.setAttribute('aria-pressed', String(Boolean(isActive(entry))));
      button.addEventListener('click', () => onPick(entry));
      row.appendChild(button);
    });
    row.scrollLeft = scrollLeft;
    if (focusedIndex >= 0) row.children[focusedIndex]?.focus({ preventScroll: true });
  }

  function renderControls() {
    chips(mediaRow, MEDIA_TABS, (item) => item.id === query.media, (item) => {
      if (query.media === item.id) return;
      query.media = item.id;
      renderControls();
      load(true);
    });
    chips(
      styleRow,
      [{ label: '全部', id: 0 }, ...genres],
      (item) => (item.id === 0 ? !query.genre : query.genre?.id === item.id),
      (item) => {
        const next = item.id === 0 ? null : item;
        if ((query.genre?.id || 0) === (next?.id || 0)) return;
        query.genre = next;
        renderControls();
        load(true);
      },
    );
    chips(regionRow, REGIONS, (item) => item.id === query.region, (item) => {
      if (query.region === item.id) return;
      query.region = item.id;
      renderControls();
      load(true);
    });
    chips(yearRow, yearEntries, (item) => item.year === (customDatesOpen ? 'custom' : query.year), (item) => {
      customDatesOpen = item.year === 'custom';
      if (customDatesOpen) { renderControls(); return; }
      query.year = item.year;
      renderControls();
      load(true);
    });
    chips(sortRow, SORTS, (item) => item.id === query.sort.id, (item) => {
      if (query.sort.id === item.id) return;
      query.sort = item;
      renderControls();
      load(true);
    });
    dateRange.hidden = !customDatesOpen;
    dateError.hidden = true;
    const period = query.year === 'custom'
      ? `${query.dateFrom || '不限开始'} 至 ${query.dateTo || '不限结束'}`
      : yearEntries.find((item) => item.year === query.year)?.label || '不限';
    summary.textContent = [
      MEDIA_TABS.find((item) => item.id === query.media).label,
      REGIONS.find((item) => item.id === query.region).label,
      query.genre?.label || '全部类别',
      `发布时间：${period}`,
      `${query.sort.label}排序`,
    ].join(' · ');
  }

  // 普通鼠标滚轮可横向浏览选项，到达边缘后仍允许页面继续上下滚动。
  for (const row of [regionRow, yearRow, sortRow]) {
    row.addEventListener('wheel', (event) => {
      if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? row.clientWidth : 1);
      const next = Math.max(0, Math.min(row.scrollWidth - row.clientWidth, row.scrollLeft + delta));
      if (next === row.scrollLeft) return;
      row.scrollLeft = next;
      event.preventDefault();
    }, { passive: false });
  }
  dateRange.addEventListener('submit', (event) => {
    event.preventDefault();
    const from = dateFromInput.value;
    const to = dateToInput.value;
    if ((!from && !to) || (from && to && from > to)) {
      dateError.textContent = !from && !to ? '请至少选择一个日期。' : '开始日期不能晚于结束日期。';
      dateError.hidden = false;
      return;
    }
    query.year = 'custom';
    customDatesOpen = true;
    query.dateFrom = from;
    query.dateTo = to;
    renderControls();
    load(true);
  });
  view.querySelector('.cf3-reset').addEventListener('click', () => {
    Object.assign(query, { genre: null, media: 'all', sort: SORTS[0], year: null, region: '', dateFrom: '', dateTo: '' });
    dateFromInput.value = '';
    dateToInput.value = '';
    customDatesOpen = false;
    renderControls();
    for (const row of [regionRow, yearRow, sortRow]) row.scrollLeft = 0;
    load(true);
  });

  // state.genres 是异步到位的（首页启动可能还在重试），进页时再核对一次
  function syncGenres() {
    const next = collectGenres(state);
    if (next.length && next.map((item) => item.id).join() !== genres.map((item) => item.id).join()) {
      genres = next;
      renderControls();
    }
  }

  renderControls();

  function cacheKey() {
    return `${sourceEpoch()}|${query.genre?.id || 0}|${query.media}|${query.sort.id}|${query.year || 0}|${query.region}|${query.dateFrom}|${query.dateTo}|${page}`;
  }

  // 数据源身份：无凭证时这一页是豆瓣片单，配好凭证后是 TMDB。凭证一变，缓存与已渲染的卡片都得作废，
  // 否则"保存并刷新"只刷新了首页，切到这一页还是旧内容（第二十六轮修的就是这个）。
  function sourceEpoch() {
    const credential = state?.credential;
    return `${credential?.configured ? '1' : '0'}:${credential?.type || ''}`;
  }

  // 与首页 loadMoreRail 同一套：合并时按 mediaType:id 去重，只把新卡片追加进网格
  function appendCards(movies) {
    const fragment = document.createDocumentFragment();
    let added = 0;
    for (const movie of movies || []) {
      const key = `${movie.mediaType === 'tv' ? 'tv' : 'movie'}:${movie.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      fragment.appendChild(buildCard(movie, state, escapeHtml));
      added += 1;
    }
    grid.appendChild(fragment);
    return added;
  }

  function paint(movies, append) {
    if (!append) {
      grid.innerHTML = '';
      seen.clear();
    }
    const added = appendCards(movies);
    if (!append && !added && !(movies || []).length) {
      grid.innerHTML = '<p class="cf3-empty">暂无符合筛选条件的作品，请调整地区、类别或发布时间。</p>';
    }
    return added;
  }

  function syncMoreButton() {
    if (!hasMore) {
      moreBtn.hidden = true;
      return;
    }
    moreBtn.hidden = false;
    moreBtn.disabled = loading;
    moreBtn.textContent = loading ? '加载中...' : failedReset ? '重试' : '加载更多';
  }

  async function load(reset) {
    if (reset) {
      failedReset = false;
      page = 1;
      hasMore = true;
      scroller.scrollTop = 0;
      if (!cache.has(cacheKey())) grid.innerHTML = skeletons();
    }
    const current = ++token;
    const key = cacheKey();
    loading = true;
    view.classList.add('is-loading');
    syncMoreButton();
    try {
      const cached = cache.get(key);
      const movies = cached || (await fetchPage(api, { ...query, page }));
      if (current !== token) return;
      if (!cached) cache.set(key, movies || []);
      const fetched = movies || [];
      const added = paint(fetched, !reset);
      view.querySelector('.cf3-load-error')?.remove();
      // 首页判底的两个条件照搬：这一页没有新卡片，或返回不足一整页
      if (!reset && !added) hasMore = false;
      else if (fetched.length < FULL_PAGE_SIZE) hasMore = false;
    } catch (error) {
      if (current !== token) return;
      if (reset) grid.innerHTML = '<p class="cf3-empty">筛选加载失败，请检查 TMDB 配置和网络后重试。</p>';
      else {
        page -= 1;
        const message = document.createElement('p');
        message.className = 'cf3-empty cf3-load-error';
        message.textContent = '加载更多失败，请重试。';
        view.querySelector('.cf3-load-error')?.remove();
        grid.append(message);
      }
      hasMore = true;
      failedReset = reset;
    } finally {
      if (current === token) {
        loading = false;
        view.classList.remove('is-loading');
        syncMoreButton();
      }
    }
  }

  // 骨架直接用基线首页的 .movie-card.skeleton 结构，样式与首页完全一致
  function skeletons() {
    return '<article class="movie-card skeleton"><div></div><span></span><small></small></article>'.repeat(SKELETON_COUNT);
  }

  function loadMore() {
    if (loading || !hasMore) return;
    if (failedReset) {
      load(true);
      return;
    }
    page += 1;
    load(false);
  }

  function maybeAutoLoadMore() {
    if (loading || !hasMore) return;
    const remaining = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (remaining < LOAD_MORE_THRESHOLD_PX) loadMore();
  }

  // 一键回到顶部：离开顶部一屏的三分之一才浮出，回到顶部就收回去
  const TO_TOP_THRESHOLD_PX = 320;
  function syncToTop() {
    const show = scroller.scrollTop > TO_TOP_THRESHOLD_PX;
    toTop.classList.toggle('is-visible', show);
    view.classList.toggle('is-scrolled', show);
  }

  toTop.addEventListener('click', (event) => {
    event.stopPropagation();
    if (scroller.scrollTo) scroller.scrollTo({ top: 0, behavior: 'smooth' });
    else scroller.scrollTop = 0;
  });

  // 首页就是 scroll + wheel 双绑定：软件渲染下滚轮未必触发 scroll 事件，补一次延后检查
  scroller.addEventListener('scroll', () => {
    maybeAutoLoadMore();
    syncToTop();
  }, { passive: true });
  scroller.addEventListener('wheel', () => window.setTimeout(() => {
    maybeAutoLoadMore();
    syncToTop();
  }, 80), { passive: true });

  moreBtn.addEventListener('click', loadMore);

  return {
    el: view,
    async activate() {
      syncGenres();
      // 凭证可能刚被向导或"保存并刷新"改掉：以主进程为准核一次再决定要不要重拉
      const fresh = await api?.getCredentialState?.().catch(() => null);
      if (fresh && state) state.credential = fresh;
      const epoch = sourceEpoch();
      if (!grid.childElementCount) {
        loadedEpoch = epoch;
        load(true);
        return;
      }
      if (loadedEpoch === epoch) return;
      // 数据源换了（豆瓣 ↔ TMDB）：缓存与已渲染卡片全部作废，整页重拉
      loadedEpoch = epoch;
      cache.clear();
      genres = collectGenres(state);
      syncGenres();
      load(true);
    },
    settle() {},
  };
}
