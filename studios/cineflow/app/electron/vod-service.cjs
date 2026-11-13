// 采集站聚合搜索服务：多页并行搜索、整源死线、详情获取、健康度记录与持久化。
// 依赖由 main.cjs 注入，便于复用现有的请求缓存、代理与设置读写。

const health = require('./vod-health.cjs');

const PAGE_TIMEOUT_MS = Number(process.env.CINEFLOW_VOD_PAGE_TIMEOUT_MS || 8000); // 单页超时
const SOURCE_DEADLINE_MS = Number(process.env.CINEFLOW_VOD_SOURCE_DEADLINE_MS || 10000); // 整源死线
const MAX_PAGES = Math.min(20, Math.max(1, Number(process.env.CINEFLOW_VOD_MAX_PAGES || 5))); // 每源最多翻页数
const DETAIL_TIMEOUT_MS = 10000;
const HEALTH_PERSIST_DELAY_MS = 1500;

function createVodService({ ipcMain, fetchJson, listSources, readSettings, writeSettings, playbackMeta }) {
  let corePromise = null;
  // vod-core 是 ESM（渲染层同样使用），主进程按需动态加载一次
  const loadCore = () => (corePromise ||= import('./vod-core.mjs'));

  let healthState = null;
  let persistTimer = null;

  function currentHealth() {
    if (!healthState) healthState = health.pruneHealth(readSettings().sourceHealth || {});
    return healthState;
  }

  function persistHealthSoon() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      try {
        const settings = readSettings();
        settings.sourceHealth = healthState || {};
        writeSettings(settings);
      } catch {
        // 健康度只是辅助信息，写盘失败不影响搜索
      }
    }, HEALTH_PERSIST_DELAY_MS);
  }

  function recordOutcomes(outcomes) {
    const result = health.recordOutcomes(currentHealth(), outcomes);
    healthState = result.health;
    persistHealthSoon();
    return result.events;
  }

  function publicSource(source, now = Date.now()) {
    const entry = currentHealth()[source.key];
    return {
      key: source.key,
      name: source.name,
      api: source.api,
      origin: source.origin || 'builtin',
      disabled: health.isDisabled(entry, now),
      health: health.describeHealth(entry, now)
    };
  }

  /** 全部已启用的采集站（含被健康度停用的，由调用方决定是否跳过）。 */
  function enabledSources() {
    return listSources().filter((source) => source && source.api && source.enabled !== false);
  }

  /** 搜索单个采集站：先取第 1 页读 pagecount，再并行取后续页；整源受死线约束，单页失败只丢该页。 */
  async function searchSource(source, wd, core) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), SOURCE_DEADLINE_MS);
    const fetchPage = (page) => fetchJson(source, { ac: 'videolist', wd, pg: page }, { timeoutMs: PAGE_TIMEOUT_MS, signal: controller.signal });
    try {
      const first = await fetchPage(1);
      const items = core.parseCmsList(first, source);
      const pageCount = Math.min(core.readPageCount(first), MAX_PAGES);
      if (pageCount > 1) {
        const pages = await Promise.all(
          Array.from({ length: pageCount - 1 }, (_, index) => fetchPage(index + 2)
            .then((payload) => core.parseCmsList(payload, source))
            .catch(() => []))
        );
        items.push(...pages.flat());
      }
      return {
        key: source.key,
        name: source.name,
        ok: true,
        ms: Date.now() - startedAt,
        pages: pageCount,
        list: core.filterSearchItems(items, wd)
      };
    } catch (error) {
      const timedOut = controller.signal.aborted || error?.name === 'AbortError';
      return {
        key: source.key,
        name: source.name,
        ok: false,
        ms: Date.now() - startedAt,
        list: [],
        timedOut,
        error: timedOut ? `请求超时（>${Math.round(SOURCE_DEADLINE_MS / 1000)} 秒）` : String(error?.message || '请求失败').slice(0, 120)
      };
    } finally {
      clearTimeout(deadline);
    }
  }

  /** 搜索一批采集站；sourceKeys 为空时搜索全部未停用的源。 */
  async function search(wd, sourceKeys) {
    const query = String(wd ?? '').normalize('NFKC').trim();
    if (!query || query.length > 100) return { ok: false, error: '搜索关键词无效', outcomes: [] };
    const core = await loadCore();
    const now = Date.now();
    const healthMap = currentHealth();
    const wanted = Array.isArray(sourceKeys) && sourceKeys.length ? new Set(sourceKeys.map(String)) : null;
    const sources = enabledSources().filter((source) => (wanted ? wanted.has(source.key) : !health.isDisabled(healthMap[source.key], now)));
    const outcomes = await Promise.all(sources.map((source) => searchSource(source, query, core)));
    const events = recordOutcomes(outcomes.map(({ key, ok, ms, error, timedOut }) => ({ key, ok, ms, error, timedOut })));
    return { ok: true, query, outcomes, disabledEvents: events };
  }

  /** 获取详情：依次尝试 ac=detail 与 ac=videolist；返回元数据与完整线路/剧集，耗时可作换源测速。 */
  async function detail(sourceKey, vodId) {
    const id = String(vodId ?? '').trim();
    if (!/^[\w-]{1,64}$/.test(id)) return { ok: false, error: '无效的影片编号' };
    const source = enabledSources().find((item) => item.key === String(sourceKey));
    if (!source) return { ok: false, error: '片源不存在或已删除' };
    const core = await loadCore();
    const startedAt = Date.now();
    let lastError = null;
    for (const ac of ['detail', 'videolist']) {
      try {
        const payload = await fetchJson(source, { ac, ids: id }, { timeoutMs: DETAIL_TIMEOUT_MS });
        const list = Array.isArray(payload?.list) ? payload.list : [];
        const item = list.find((entry) => String(entry?.vod_id) === id) || list[0];
        if (!item) continue;
        const lines = core.splitPlayGroups(item).map((group) => ({
          name: group.name,
          episodes: group.episodes.map((episode) => ({ ...episode, ...playbackMeta(episode.url, group.name) }))
        }));
        if (!lines.length) continue;
        return { ok: true, ms: Date.now() - startedAt, meta: core.parseDetailMeta(item, source), lines };
      } catch (error) {
        lastError = error;
      }
    }
    return { ok: false, ms: Date.now() - startedAt, error: lastError ? String(lastError.message || lastError).slice(0, 120) : '该片源没有可播放的剧集' };
  }

  function listPublicSources() {
    const now = Date.now();
    return enabledSources().map((source) => publicSource(source, now));
  }

  function resetSourceHealth(key) {
    healthState = health.resetHealth(currentHealth(), key ? String(key) : '');
    persistHealthSoon();
    return listPublicSources();
  }

  ipcMain.handle('vod:sources', async () => listPublicSources());
  ipcMain.handle('vod:search', async (_event, wd, sourceKeys) => search(wd, sourceKeys));
  ipcMain.handle('vod:detail', async (_event, sourceKey, vodId) => detail(sourceKey, vodId));
  ipcMain.handle('health:list', async () => listPublicSources());
  ipcMain.handle('health:reset', async (_event, key) => resetSourceHealth(key));

  return { search, detail, listPublicSources, resetSourceHealth, recordOutcomes };
}

module.exports = { createVodService, MAX_PAGES, SOURCE_DEADLINE_MS };
