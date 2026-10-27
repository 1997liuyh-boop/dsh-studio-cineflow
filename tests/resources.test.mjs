import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
const require=createRequire(import.meta.url)
const {parseResourcePayload}=require('../studios/cineflow/app/electron/studio-resource-payload.cjs')

test('原始提交归档保留35条记录及34个不同网址，运行时另做接口身份去重',async()=>{
  const payload=JSON.parse(await readFile('studios/cineflow/sources.json','utf8'))
  assert.equal(payload.importedCount,35);assert.equal(payload.sources.length,34)
  assert.equal(new Set(payload.sources.map(source=>source.url)).size,34)
  assert.equal(new Set(payload.sources.map(source=>source.id)).size,34)
  assert.equal(payload.sources.filter(source=>source.name==='酷点资源').length,2)
  assert.equal(payload.sources.filter(source=>source.name==='唐人街').length,2)
  assert.ok(payload.sources.some(source=>source.url.endsWith('/at/xm')))
})

test('XML影片列表和多条播放线路可被原播放器读取',()=>{
  const xml='<rss><list page="1" recordcount="1"><video><id>0001</id><name><![CDATA[示例影片]]></name><year>2024</year><dl><dd flag="hls"><![CDATA[正片$https://example.org/movie.m3u8]]></dd><dd flag="mp4"><![CDATA[正片$https://example.org/movie.mp4]]></dd></dl></video></list></rss>'
  const result=parseResourcePayload(xml)
  assert.equal(result.list[0].vod_id,'0001')
  assert.equal(result.list[0].vod_name,'示例影片')
  assert.equal(result.list[0].vod_play_from,'hls$$$mp4')
  assert.match(result.list[0].vod_play_url,/m3u8\$\$\$正片\$/)
  assert.deepEqual(parseResourcePayload('{"list":[]}'),{list:[]})
  assert.throws(()=>parseResourcePayload('<html>错误页面</html>'),/缺少影片列表/)
  assert.throws(()=>parseResourcePayload('<!DOCTYPE rss><rss/>'),/声明不受支持/)
})
