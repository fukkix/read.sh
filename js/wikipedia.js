/**
 * FIREADER — Wikipedia API Module
 * Supports EN and ZH, random + search + summary
 */
const Wikipedia = (() => {
  const REST = {
    en: 'https://en.wikipedia.org/api/rest_v1',
    zh: 'https://zh.wikipedia.org/api/rest_v1'
  };
  const ACTION = {
    en: 'https://en.wikipedia.org/w/api.php',
    zh: 'https://zh.wikipedia.org/w/api.php'
  };

  function base(lang) { return REST[lang] || REST.en; }
  function api(lang)  { return ACTION[lang] || ACTION.en; }

  function normalizeEntry(data, lang) {
    return {
      title:       data.title || '',
      description: data.description || '',
      extract:     data.extract || '',
      lang:        lang,
      source:      lang === 'zh' ? 'Wikipedia ZH' : 'Wikipedia EN',
      url:         data.content_urls?.desktop?.page || '',
      thumbnail:   data.thumbnail?.source || null
    };
  }

  async function fetchRandom(lang = 'en') {
    const res = await fetch(`${base(lang)}/page/random/summary`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return normalizeEntry(data, lang);
  }

  async function fetchSummary(title, lang = 'en') {
    const slug = encodeURIComponent(title.replace(/\s+/g, '_'));
    const res = await fetch(`${base(lang)}/page/summary/${slug}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return normalizeEntry(data, lang);
  }

  async function fetchFull(title, lang = 'en') {
    const slug = encodeURIComponent(title.replace(/\s+/g, '_'));
    const url = `${api(lang)}?action=query&titles=${slug}&prop=extracts&explaintext=true&exsectionformat=plain&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) throw new Error('No pages returned');
    const page = Object.values(pages)[0];
    if (page.missing !== undefined) throw new Error('Article not found');
    return page.extract || '';
  }

  async function search(query, lang = 'en') {
    const q = encodeURIComponent(query);
    const url = `${api(lang)}?action=opensearch&search=${q}&limit=12&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // [query, titles[], descriptions[], urls[]]
    const titles = data[1] || [];
    const descs   = data[2] || [];
    return titles.map((title, i) => ({
      title,
      description: descs[i] || '',
      lang
    }));
  }

  return { fetchRandom, fetchSummary, fetchFull, search };
})();
