import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const { cleanTitleQuery, rankTitleResults } = require('../studios/cineflow/app/electron/studio-title-search.cjs')
const main = await readFile(new URL('../studios/cineflow/app/electron/main.cjs', import.meta.url), 'utf8')
const searchHandler = main.slice(main.indexOf("ipcMain.handle('tmdb:search'"), main.indexOf("ipcMain.handle('tmdb:discover'"))

function createSearch(fetch) {
  let handler
  vm.runInNewContext(searchHandler, {
    ipcMain: { handle: (_channel, callback) => { handler = callback } },
    cleanTitleQuery, rankTitleResults,
    tmdbFetch: fetch,
    DEFAULT_REGION: 'CN',
    compactMovies: (movies, limit) => movies.slice(0, limit),
    settle: promise => promise.then(value => ({ status: 'fulfilled', value }), reason => ({ status: 'rejected', reason }))
  })
  return (query, options) => handler(null, query, options)
}

test('清理书名号和不可见字符，保留完整片名', () => {
  assert.equal(cleanTitleQuery(' 《ＪＯＪＯ的奇妙冒\u200b险》 '), 'JOJO的奇妙冒险')
  assert.equal(cleanTitleQuery('爱情公寓'), '爱情公寓')
  assert.equal(cleanTitleQuery('我是谁'), '我是谁')
})

test('电影和节目统一排序，同名节目不会被电影续作挤到后面', () => {
  const movies = [{ title: 'JOJO的奇妙冒险 幻影血脉' }, { name: 'JOJO的奇妙冒险' }, { name: 'JOJO的奇妙冒险OVA' }]
  assert.deepEqual(rankTitleResults(movies, 'jojo的奇妙冒险').map(movie => movie.title || movie.name), ['JOJO的奇妙冒险', 'JOJO的奇妙冒险 幻影血脉', 'JOJO的奇妙冒险OVA'])
  const many = [...Array.from({ length: 30 }, (_, i) => ({ title: `蝙蝠侠：续作${i}` })), { title: '蝙蝠侠' }]
  assert.equal(rankTitleResults(many, '蝙蝠侠')[0].title, '蝙蝠侠')
})

test('精确模式只保留同名作品，兼容大小写、标点和原名', () => {
  const movies = [{ title: '绿皮书' }, { title: '绿皮书：自由的指南' }, { title: '其他', original_title: 'Green Book' }]
  assert.deepEqual(rankTitleResults(movies, '绿皮书', true), [movies[0]])
  assert.deepEqual(rankTitleResults(movies, 'green book', true), [movies[2]])
  assert.deepEqual(rankTitleResults([{ name: 'JOJO 的奇妙冒险' }], 'jojo的奇妙冒险', true), [{ name: 'JOJO 的奇妙冒险' }])
  assert.deepEqual(rankTitleResults(movies, '不存在的片名', true), [])
})

test('嵌入桥接传入 null 时正常搜索，默认不混入演员和关键词推荐', async () => {
  const calls = []
  const search = createSearch(async (path, options) => {
    calls.push({ path, options })
    return { results: path === '/search/movie' ? [{ id: 1, title: '绿皮书' }] : [] }
  })
  assert.equal((await search('绿皮书', null))[0].title, '绿皮书')
  assert.deepEqual(calls.map(call => call.path), ['/search/movie', '/search/tv'])
  assert.ok(calls.every(call => call.options.query === '绿皮书' && call.options.page === 1))
})

test('第一页、加载更多均使用干净片名和精确匹配条件', async () => {
  const calls = []
  const search = createSearch(async (path, options) => {
    calls.push({ path, options })
    return { results: path === '/search/movie' ? [{ title: '绿皮书：自由的指南' }, { title: '绿皮书' }] : [] }
  })
  assert.equal((await search('《绿皮\u200b书》', { match: 'exact', page: 2 })).length, 1)
  assert.ok(calls.every(call => call.options.query === '绿皮书' && call.options.page === 2))
})

test('网络错误必须上抛，不能伪装为没有结果', async () => {
  const search = createSearch(async () => { throw new Error('连接失败') })
  await assert.rejects(search('蝙蝠侠', null), /连接失败/)
})
