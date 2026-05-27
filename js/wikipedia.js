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
    space: { 
      name: 'Astrophysics', 
      en: ['Astrophysics', 'Cosmology', 'Space exploration', 'Quantum mechanics', 'Black hole', 'General relativity', 'Dark matter', 'Exoplanet', 'Nebula', 'String theory', 'Gravitational wave', 'Milky Way', 'Supernova', 'Speed of light', 'Hubble Space Telescope', 'Neutron star', 'Big Bang', 'Wormhole', 'Dark energy', 'Event horizon', 'Antimatter', 'Quasar', 'Pulsar', 'Standard Model', 'Time dilation', 'Multiverse', 'Oort cloud', 'Carl Sagan', 'James Webb Space Telescope', 'Interstellar travel', 'Cosmic microwave background', 'Quantum entanglement'], 
      zh: ['天体物理学', '宇宙学', '太空探索', '量子力学', '黑洞', '广义相对论', '暗物质', '系外行星', '星云', '弦理论', '引力波', '银河系', '超新星', '光速', '哈勃空间望远镜', '中子星', '大爆炸', '虫洞', '暗能量', '事件视界', '反物质', '类星体', '脉冲星', '标准模型', '时间膨胀', '多重宇宙', '奥尔特云', '卡尔·萨根', '斯蒂芬·霍金', '詹姆斯·韦伯空间望远镜', '星际旅行', '宇宙微波背景辐射', '量子纠缠'] 
    },
    history: { 
      name: 'World History', 
      en: ['World history', 'Ancient Rome', 'Ming dynasty', 'Industrial Revolution', 'Cold War', 'Renaissance', 'Byzantine Empire', 'Viking Age', 'Ancient Egypt', 'French Revolution', 'Maya civilization', 'World War I', 'World War II', 'Ottoman Empire', 'Mongol Empire', 'Silk Road', 'Qing dynasty', 'Aztec', 'Inca Empire', 'Mesopotamia', 'Sumer', 'Han dynasty', 'American Civil War', 'British Empire', 'Crusades', 'Black Death', 'Age of Discovery', 'Meiji Restoration', 'Soviet Union'], 
      zh: ['世界历史', '古罗马', '明朝', '工业革命', '冷战', '文艺复兴', '拜占庭帝国', '维京时代', '古埃及', '法国大革命', '玛雅文明', '第一次世界大战', '第二次世界大战', '奥斯曼帝国', '蒙古帝国', '丝绸之路', '清朝', '阿兹特克', '印加帝国', '美索不达米亚', '苏美尔', '汉朝', '南北战争', '大英帝国', '十字军东征', '黑死病', '大航海时代', '明治维新', '苏联', '唐朝', '罗马帝国'] 
    },
    art: { 
      name: 'Literature & Art', 
      en: ['History of art', 'Modern literature', 'Baroque', 'Romanticism', 'Classical music', 'Postmodernism', 'Surrealism', 'Impressionism', 'Cubism', 'Renaissance art', 'Gothic architecture', 'Abstract expressionism', 'Pop art', 'Jazz', 'William Shakespeare', 'Vincent van Gogh', 'Leonardo da Vinci', 'Magic realism', 'Cyberpunk literature', 'Gothic fiction', 'Minimalism', 'Art Nouveau', 'Dada', 'Beat Generation', 'Existentialist literature'], 
      zh: ['艺术史', '文学', '巴洛克', '浪漫主义', '古典音乐', '后现代主义', '印象派', '超现实主义', '立体主义', '文艺复兴艺术', '哥特式建筑', '抽象表现主义', '波普艺术', '爵士乐', '威廉·莎士比亚', '文森特·梵高', '列奥纳多·达·芬奇', '魔幻现实主义', '哥特小说', '极简主义', '新艺术运动', '达达主义', '垮掉的一代', '存在主义文学', '古典主义', '现代主义', '宋词', '唐诗'] 
    },
    philosophy: { 
      name: 'Philosophy', 
      en: ['Philosophy', 'Existentialism', 'Nietzsche', 'Stoicism', 'Epistemology', 'Nihilism', 'Metaphysics', 'Ethics', 'Phenomenology', 'Absurdism', 'Determinism', 'Utilitarianism', 'Rationalism', 'Empiricism', 'Immanuel Kant', 'Socrates', 'Plato', 'Aristotle', 'René Descartes', 'Jean-Paul Sartre', 'Albert Camus', 'Arthur Schopenhauer', 'Confucianism', 'Taoism', 'Buddhism', 'Aesthetics', 'Logic'], 
      zh: ['哲学', '存在主义', '尼采', '斯多葛主义', '认识论', '唯物主义', '虚无主义', '形而上学', '伦理学', '现象学', '荒谬主义', '决定论', '功利主义', '理性主义', '经验主义', '伊曼努尔·康德', '苏格拉底', '柏拉图', '亚里士多德', '勒内·笛卡尔', '让-保罗·萨特', '阿尔贝·加缪', '亚瑟·叔本华', '儒家', '道家', '佛教', '美学', '逻辑学', '庄子'] 
    },
    cs: { 
      name: 'Computer Science', 
      en: ['Computer science', 'Turing machine', 'Unix', 'Hacker culture', 'Algorithms', 'Artificial intelligence', 'Machine learning', 'Cryptography', 'Data structure', 'Operating system', 'Compiler', 'Computer network', 'Database', 'Distributed computing', 'Quantum computing', 'Software engineering', 'Alan Turing', 'Internet', 'Linux', 'Open-source software', 'Information theory', 'Blockchain', 'Computer graphics', 'Cloud computing'], 
      zh: ['计算机科学', '图灵机', 'Unix', '黑客文化', '算法', '信息论', '人工智能', '机器学习', '密码学', '数据结构', '操作系统', '编译器', '计算机网络', '数据库', '分布式计算', '量子计算', '软件工程', '阿兰·图灵', '互联网', 'Linux', '开源软件', '区块链', '计算机图形学', '云计算', '面向对象编程'] 
    },
    biology: { 
      name: 'Life Sciences', 
      en: ['Evolutionary biology', 'CRISPR', 'Cambrian explosion', 'Neuroscience', 'Genetics', 'Molecular biology', 'DNA', 'Paleontology', 'Dinosaurs', 'Charles Darwin', 'Immune system', 'Cell biology', 'Ecology', 'Botany', 'Zoology', 'Synthetic biology', 'Epigenetics', 'Origin of life', 'Astrobiology', 'Virology', 'Stem cell', 'Microbiome', 'Bioinformatics', 'Evolution'], 
      zh: ['演化生物学', '基因编辑', '寒武纪大爆发', '神经科学', '遗传学', '分子生物学', '脱氧核糖核酸', '古生物学', '恐龙', '查尔斯·达尔文', '免疫系统', '细胞生物学', '生态学', '植物学', '动物学', '合成生物学', '表观遗传学', '生命起源', '天体生物学', '病毒学', '干细胞', '微生物组', '生物信息学', '进化'] 
    },
    myth: { 
      name: 'Mythology', 
      en: ['Mythology', 'Norse mythology', 'Cthulhu Mythos', 'Astrology', 'Greek mythology', 'Egyptian mythology', 'Celtic mythology', 'Japanese mythology', 'Chinese mythology', 'Hindu mythology', 'Urban legend', 'Folklore', 'Odin', 'Zeus', 'Thor', 'Vampire', 'Dragon', 'Phoenix', 'Atlantis', 'Excalibur', 'Valhalla', 'Underworld', 'Demonology', 'Alchemy', 'Occultism'], 
      zh: ['神话学', '北欧神话', '克苏鲁神话', '占星术', '希腊神话', '埃及神话', '凯尔特神话', '日本神话', '中国神话', '印度神话', '都市传说', '民间传说', '奥丁', '宙斯', '索尔', '吸血鬼', '龙', '凤凰', '亚特兰蒂斯', '王者之剑', '英灵殿', '冥界', '恶魔学', '炼金术', '神秘主义', '山海经'] 
    },
    cyber: { 
      name: 'Cyberpunk', 
      en: ['Cyberpunk', 'Artificial intelligence', 'Dystopia', 'Transhumanism', 'Virtual reality', 'Cyborg', 'Megacorporation', 'Postcyberpunk', 'Steampunk', 'Neuromancer', 'Blade Runner', 'Ghost in the Shell', 'Technological singularity', 'Augmented reality', 'Hacker', 'Brain-computer interface', 'Cybernetics', 'Bionics', 'Neon', 'Sci-fi', 'Philip K. Dick', 'William Gibson'], 
      zh: ['赛博朋克', '人工智能', '反乌托邦', '超人类主义', '虚拟现实', '赛博格', '巨型企业', '后赛博朋克', '蒸汽朋克', '神经漫游者', '银翼杀手', '攻壳机动队', '技术奇异点', '增强现实', '黑客', '脑机接口', '控制论', '仿生学', '霓虹灯', '科幻', '菲利普·狄克', '威廉·吉布森'] 
    },
    econ: { 
      name: 'Economics', 
      en: ['Macroeconomics', 'Game theory', 'Prisoner\'s dilemma', 'Cryptocurrency', 'Capitalism', 'Microeconomics', 'Behavioral economics', 'Free market', 'Keynesian economics', 'Monetary policy', 'Fiscal policy', 'Inflation', 'Stock market', 'Karl Marx', 'Adam Smith', 'Supply and demand', 'Globalization', 'Venture capital', 'Blockchain', 'Nash equilibrium', 'Tragedy of the commons'], 
      zh: ['宏观经济学', '博弈论', '囚徒困境', '加密货币', '资本主义', '微观经济学', '行为经济学', '自由市场', '凯恩斯主义', '货币政策', '财政政策', '通货膨胀', '股票市场', '卡尔·马克思', '亚当·斯密', '供需', '全球化', '风险投资', '纳什均衡', '公地悲剧', '经济危机', '福利经济学'] 
    }
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

  async function fetchRandom(lang = 'en', domain = 'any', history = []) {
    const readTitles = new Set(history.map(h => h.title));
    
    if (domain === 'any' || !DOMAINS[domain]) {
      // Retry loop for true random
      for (let i = 0; i < 3; i++) {
        const res = await fetch(`${base(lang)}/page/random/summary`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!readTitles.has(data.title)) {
          return normalizeEntry(data, lang);
        }
      }
      throw new Error('Could not find unread random article');
    } else {
      const historyForDomain = history.filter(h => h.domain === domain);
      
      // 50% chance to do Wiki-Walk if we have history
      if (historyForDomain.length > 0 && Math.random() < 0.5) {
        const randomHist = historyForDomain[Math.floor(Math.random() * historyForDomain.length)];
        const links = await fetchLinks(randomHist.title, lang);
        const unreadLinks = links.filter(link => !readTitles.has(link.title));
        
        if (unreadLinks.length > 0) {
          const randomLink = unreadLinks[Math.floor(Math.random() * unreadLinks.length)];
          try {
            return await fetchSummary(randomLink.title, lang);
          } catch (e) {
            // fallback if summary fetch fails
          }
        }
      }
      
      // Seed Strategy or Fallback
      const keywords = DOMAINS[domain][lang];
      for (let i = 0; i < 3; i++) {
        const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
        const results = await search(randomKeyword, lang);
        const unreadResults = results.filter(r => !readTitles.has(r.title));
        
        if (unreadResults.length > 0) {
          const limit = Math.min(10, unreadResults.length);
          const randomEntry = unreadResults[Math.floor(Math.random() * limit)];
          try {
            return await fetchSummary(randomEntry.title, lang);
          } catch (e) {
            // fallback loop
          }
        }
      }
      throw new Error('No unread results found for domain after retries');
    }
  }

  async function fetchLinks(title, lang = 'en') {
    const slug = encodeURIComponent(title.replace(/\s+/g, '_'));
    const url = `${api(lang)}?action=query&titles=${slug}&prop=links&pllimit=50&plnamespace=0&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return [];
    const page = Object.values(pages)[0];
    return page.links || [];
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
