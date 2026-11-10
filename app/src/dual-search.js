// 片名保持完整，只清理粘贴时带入的不可见字符和外围书名号。
export function cleanSearchQuery(value) {
  return String(value || '').normalize('NFKC')
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, '')
    .replace(/\s+/g, ' ').trim()
    .replace(/^[《「【“‘"']+|[》」】”’"']+$/g, '').trim();
}
