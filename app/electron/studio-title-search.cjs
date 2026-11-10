function cleanTitleQuery(value) {
  return String(value || '').normalize('NFKC')
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, '')
    .replace(/\s+/g, ' ').trim()
    .replace(/^[《「【“‘"']+|[》」】”’"']+$/g, '').trim();
}

function normalizeTitle(value) {
  return cleanTitleQuery(value).toLowerCase().replace(/[\p{P}\p{Z}\s]/gu, '');
}

// 先合并电影与节目并按片名排序，再截取展示数量，避免同名节目被续作挤掉。
function rankTitleResults(results, query, exact = false) {
  const target = normalizeTitle(query);
  if (!target) return [];
  return results.map((movie, index) => {
    const titles = [movie.title, movie.name, movie.original_title, movie.original_name, movie.originalTitle]
      .map(normalizeTitle).filter(Boolean);
    const score = titles.includes(target) ? 2 : titles.some(title => title.includes(target)) ? 1 : 0;
    return { movie, index, score };
  }).filter(item => !exact || item.score === 2)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.movie);
}

module.exports = { cleanTitleQuery, rankTitleResults };
