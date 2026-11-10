const { XMLParser } = require('fast-xml-parser');
const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, processEntities: false });
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const text = value => typeof value === 'object' && value ? String(value['#text'] || '') : String(value || '');

/** 苹果 CMS 的 XML 与 JSON 返回统一的影片及播放线路字段。 */
exports.parseResourcePayload = function parseResourcePayload(source) {
  const input = String(source || '').replace(/^\uFEFF/, '').trim();
  if (!input.startsWith('<')) return JSON.parse(input);
  if (/<!DOCTYPE|<!ENTITY/i.test(input)) throw new Error('资源 XML 声明不受支持');
  const payload = parser.parse(input);
  const list = payload.rss?.list;
  if (!list) throw new Error('资源 XML 缺少影片列表');
  return {
    page: Number(list['@_page'] || 1), pagecount: Number(list['@_pagecount'] || 1), total: Number(list['@_recordcount'] || 0),
    list: array(list.video).map(video => {
      const lines = array(video.dl?.dd);
      return {
        vod_id: text(video.id), vod_name: text(video.name), vod_pic: text(video.pic), vod_year: text(video.year),
        type_name: text(video.type), vod_remarks: text(video.note), vod_content: text(video.des),
        vod_play_from: lines.map(line => line['@_flag'] || '默认线路').join('$$$'),
        vod_play_url: lines.map(text).join('$$$')
      };
    })
  };
};
