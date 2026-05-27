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

  const DOMAINS = {
    space: { name: 'Astrophysics', en: ['Astrophysics', 'Cosmology', 'Space exploration', 'Quantum mechanics', 'Black hole', 'General relativity'], zh: ['天体物理学', '宇宙学', '太空探索', '量子力学', '黑洞', '广义相对论', '星系'] },
    history: { name: 'World History', en: ['World history', 'Ancient Rome', 'Ming dynasty', 'Industrial Revolution', 'Cold War', 'Renaissance'], zh: ['世界历史', '古罗马', '明朝', '工业革命', '冷战', '文艺复兴', '中世纪'] },
    art: { name: 'Literature & Art', en: ['History of art', 'Modern literature', 'Baroque', 'Romanticism', 'Classical music', 'Postmodernism'], zh: ['艺术史', '文学', '巴洛克', '浪漫主义', '古典音乐', '后现代主义', '印象派'] },
    philosophy: { name: 'Philosophy', en: ['Philosophy', 'Existentialism', 'Nietzsche', 'Stoicism', 'Epistemology'], zh: ['哲学', '存在主义', '尼采', '斯多葛主义', '认识论', '唯物主义'] },
    cs: { name: 'Computer Science', en: ['Computer science', 'Turing machine', 'Unix', 'Hacker culture', 'Algorithms'], zh: ['计算机科学', '图灵机', 'Unix', '黑客文化', '算法', '信息论'] },
    biology: { name: 'Life Sciences', en: ['Evolutionary biology', 'CRISPR', 'Cambrian explosion', 'Neuroscience', 'Genetics'], zh: ['演化生物学', '基因编辑', '寒武纪大爆发', '神经科学', '遗传学'] },
    myth: { name: 'Mythology', en: ['Mythology', 'Norse mythology', 'Cthulhu Mythos', 'Astrology', 'Greek mythology'], zh: ['神话学', '北欧神话', '克苏鲁神话', '占星术', '希腊神话'] },
    cyber: { name: 'Cyberpunk', en: ['Cyberpunk', 'Artificial intelligence', 'Dystopia', 'Transhumanism', 'Virtual reality'], zh: ['赛博朋克', '人工智能', '反乌托邦', '超人类主义', '虚拟现实'] },
    econ: { name: 'Economics', en: ['Macroeconomics', 'Game theory', 'Prisoner\'s dilemma', 'Cryptocurrency', 'Capitalism'], zh: ['宏观经济学', '博弈论', '囚徒困境', '加密货币', '资本主义'] }
  };

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

  async function fetchRandom(lang = 'en', domain = 'any') {
    if (domain === 'any' || !DOMAINS[domain]) {
      const res = await fetch(`${base(lang)}/page/random/summary`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return normalizeEntry(data, lang);
    } else {
      const keywords = DOMAINS[domain][lang];
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
      const results = await search(randomKeyword, lang);
      if (results.length === 0) throw new Error('No results for domain keyword');
      const limit = Math.min(10, results.length);
      const randomEntry = results[Math.floor(Math.random() * limit)];
      return await fetchSummary(randomEntry.title, lang);
    }
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

  return { fetchRandom, fetchSummary, fetchFull, search, DOMAINS };
})();
