import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const sources = require('../studios/cineflow/app/electron/studio-sources.cjs')

test('网页与错误响应不能冒充有效的采集接口', () => {
  assert.throws(() => sources.validateResourcePayload('<html><title>验证页面</title></html>'))
  assert.throws(() => sources.validateResourcePayload('{"error":"blocked"}'))
  assert.throws(() => sources.validateResourcePayload('{"list":"not-a-list"}'))
  assert.deepEqual(sources.validateResourcePayload('{"list":[],"page":1}').list, [])
  assert.equal(sources.validateResourcePayload('<rss><list page="1"><video><id>1</id><name>测试</name></video></list></rss>').list[0].vod_name, '测试')
})

test('TVBox 接收 JSON/XML，拒绝 CSP、JAR 和远程脚本', () => {
  assert.equal(sources.tvBoxSiteToSourceEntry({ type: 0, api: 'https://example.com/xml?ac=list', name: 'XML' }).api, 'https://example.com/xml')
  assert.equal(sources.tvBoxSiteToSourceEntry({ type: 1, api: 'https://example.com/vod/', name: 'JSON' }).api, 'https://example.com/vod')
  assert.equal(sources.tvBoxSiteToSourceEntry({ type: 3, api: 'https://example.com/spider.jar' }), null)
  assert.equal(sources.tvBoxSiteToSourceEntry({ type: 1, api: 'csp_Test' }), null)
  assert.equal(sources.tvBoxSiteToSourceEntry({ type: 1, api: 'https://example.com/spider.js' }), null)
})

test('清理重复参数时保留接口的其他查询条件', () => {
  assert.equal(sources.canonicalApi('https://example.com/vod/?token=public&ac=list'), 'https://example.com/vod?token=public')
})

test('同接口协议和 CMS 输出格式去重，保留不同线路及认证参数', () => {
  const identity = sources.resourceIdentity
  assert.equal(identity('http://example.com/api.php/provide/vod/at/xm?ac=list'), identity('https://example.com/api.php/provide/vod'))
  assert.equal(identity('https://example.com/api.php/provide/vod?token=a&key=b'), identity('https://example.com/api.php/provide/vod?key=b&token=a'))
  assert.notEqual(identity('https://example.com/api.php/provide/vod/from/line1'), identity('https://example.com/api.php/provide/vod/from/line2'))
  assert.notEqual(identity('https://example.com/api.php/provide/vod/from/line1'), identity('https://example.com/api.php/provide/vod'))
  assert.notEqual(identity('https://example.com/api.php/provide/vod?token=a'), identity('https://example.com/api.php/provide/vod?token=b'))
  assert.notEqual(identity('https://a.example/vod'), identity('https://b.example/vod'))
})

test('合并时自定义配置覆盖相同内置接口，同名镜像仍是独立线路', () => {
  const custom = { key: 'mine', name: '我的如意', api: 'http://example.com/api.php/provide/vod', enabled: false, origin: 'custom' }
  const builtin = { key: 'builtin', name: '如意', api: 'https://example.com/api.php/provide/vod/at/xml', origin: 'builtin' }
  const mirror = { name: '如意', api: 'https://mirror.example/api.php/provide/vod', origin: 'builtin' }
  assert.deepEqual(sources.deduplicateResourceSources([custom, builtin, mirror]), [custom, mirror])
  assert.equal(sources.resourceProvider({ name: '量子資源', api: 'http://cj.lziapi.com/api.php/provide/vod/from/lzm3u8' }).key, sources.resourceProvider({ name: '量子资源', api: 'https://cj.lziapi.com/api.php/provide/vod' }).key)
  assert.equal(sources.resourceProvider({ name: '閃電資源' }).key, sources.resourceProvider({ name: '闪电资源' }).key)
  assert.equal(sources.resourceProvider({ name: '酷点资源', api: 'http://api.kuapi.cc/api.php/provide/vod' }).key, sources.resourceProvider({ name: '酷点资源', api: 'http://kudian10.com/api.php/provide/vod' }).key)
})

test('版本二只清理重复，不回填删除的源，并保留用户开关', () => {
  const first = { name: '自定义名', api: 'http://example.com/api.php/provide/vod', enabled: false }
  const settings = { studioSourceSeedVersion: 2, customResourceSources: [first, { api: 'https://example.com/api.php/provide/vod/at/xml' }] }
  assert.equal(sources.migrateStudioResourceSources(settings, entry => entry), true)
  assert.equal(settings.studioSourceSeedVersion, 3)
  assert.deepEqual(settings.customResourceSources, [first])
  assert.equal(sources.migrateStudioResourceSources(settings, entry => entry), false)
  const cleared = { studioSourceSeedVersion: 2, customResourceSources: [] }
  sources.migrateStudioResourceSources(cleared, entry => entry)
  assert.deepEqual(cleared.customResourceSources, [])
})

test('旧版漏导入后一次性补齐片源，保留已有设置并按接口去重', () => {
  const normalize = entry => entry?.url || entry?.api ? { ...entry, api: sources.canonicalApi(entry.api || entry.url) } : null
  const custom = { name: '我的命名', api: 'https://example.com/vod/?ac=list', enabled: false }
  const settings = { studioSourceSeedVersion: 1, customResourceSources: [custom], resourceMode: 'movie' }
  const seeds = [{ name: '重复', url: 'https://example.com/vod' }, { url: 'https://new.example/vod/' }, { url: 'https://new.example/vod?ac=list' }, {}]
  assert.equal(sources.migrateStudioResourceSources(settings, normalize, seeds), true)
  assert.equal(settings.studioSourceSeedVersion, 3)
  assert.equal(settings.customResourceSources.length, 2)
  assert.deepEqual(settings.customResourceSources[0], custom)
  assert.equal(settings.resourceMode, 'movie')
  settings.customResourceSources = []
  assert.equal(sources.migrateStudioResourceSources(settings, normalize, seeds), false)
  assert.deepEqual(settings.customResourceSources, [])
})

test('版本一的空片源列表恢复全部原始接口，新安装也可直接导入', () => {
  const seeds = require('../studios/cineflow/app/studio-sources.json').sources
  const normalize = entry => ({ ...entry, api: sources.canonicalApi(entry.api || entry.url) })
  for (const settings of [{ studioSourceSeedVersion: 1, customResourceSources: [] }, {}]) {
    assert.equal(sources.migrateStudioResourceSources(settings, normalize), true)
    assert.equal(settings.customResourceSources.length, 33)
    assert.deepEqual(new Set(settings.customResourceSources.map(source => sources.resourceIdentity(source.api))), new Set(seeds.map(source => sources.resourceIdentity(source.url))))
  }
})

test('网页状态区分可达、人机验证和停靠页面，拒绝任意后台请求', async () => {
  const url = sources.catalog.websites[0].url
  const healthy = await sources.testWebsite(async () => new Response('<html><title>动漫</title></html>'), url)
  assert.equal(healthy.state, 'page')
  assert.equal(healthy.ok, true)
  const challenge = await sources.testWebsite(async () => new Response('<html>Just a moment cf-chl-</html>', { status: 403 }), url)
  assert.equal(challenge.state, 'challenge')
  assert.equal(challenge.ok, false)
  const parked = await sources.testWebsite(async () => new Response('<html>domain is for sale</html>'), url)
  assert.equal(parked.state, 'parked')
  const invalid = await sources.testWebsite(() => { throw new Error('不应发请求') }, 'http://127.0.0.1/private')
  assert.equal(invalid.state, 'unknown')
})
