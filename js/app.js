/**
 * FIREADER — Main Application Logic
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const els = {
    splash: document.getElementById('splash'),
    editorContent: document.getElementById('editor-content'),
    gutter: document.getElementById('gutter'),
    scrollArea: document.getElementById('editor-scroll'),
    tabName: document.getElementById('tab-name'),
    langToggle: document.getElementById('lang-toggle'),
    progressText: document.getElementById('progress-text'),
    progressBar: document.getElementById('progress-bar'),
    loader: document.getElementById('loader'),
    loaderText: document.getElementById('loader-text'),
    btnRandom: document.getElementById('btn-random'),
    btnSearch: document.getElementById('btn-search'),
    btnUpload: document.getElementById('btn-upload'),
    fileInput: document.getElementById('file-input'),
    modalSearch: document.getElementById('modal-search'),
    searchInput: document.getElementById('search-input'),
    searchResults: document.getElementById('search-results'),
    modalAnnotate: document.getElementById('modal-annotate'),
    annotateInput: document.getElementById('annotate-input'),
    btnSettings: document.getElementById('btn-settings'),
    btnSync: document.getElementById('btn-sync'),
    modalSettings: document.getElementById('modal-settings'),
    settingToken: document.getElementById('setting-token'),
    settingGist: document.getElementById('setting-gist'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnOpenTopics: document.getElementById('btn-open-topics'),
    modalTopics: document.getElementById('modal-topics'),
    topicGrid: document.getElementById('topic-grid'),
    currentTopicLabel: document.getElementById('current-topic-label'),
    selectedTopicVal: document.getElementById('selected-topic-val'),
    btnNext: document.getElementById('btn-next'),
    btnHome: document.getElementById('btn-home'),
    btnEpubToc: document.getElementById('btn-epub-toc'),
    btnEpubPrev: document.getElementById('btn-epub-prev'),
    btnEpubNext: document.getElementById('btn-epub-next'),
    modalToc: document.getElementById('modal-toc'),
    tocList: document.getElementById('toc-list')
  };

  let state = {
    lang: 'zh', // default language
    mode: 'none', // 'wiki' or 'epub'
    title: '',
    lines: [], // raw text lines
    renderedHTML: '', // syntax highlighted html
    progress: 0,
    annotations: {},
    currentLineNum: null,
    epub: { book: null, currentIdx: 0 }
  };

  // ── Initialization ────────────────────────────────────────
  
  // Load settings
  const savedLang = await DB.getSetting('lang');
  if (savedLang) state.lang = savedLang;
  els.langToggle.textContent = state.lang.toUpperCase();

  const ghToken = await DB.getSetting('ghToken');
  const ghGist = await DB.getSetting('ghGist');
  if (ghToken) els.settingToken.value = ghToken;
  if (ghGist) els.settingGist.value = ghGist;

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.error('SW registration failed:', err));
  }

  // ── Core Render Logic ─────────────────────────────────────
  
  function setLoader(active, text = 'Loading...') {
    els.loaderText.textContent = text;
    if (active) els.loader.classList.add('active');
    else els.loader.classList.remove('active');
  }

  function updateHeaderControls() {
    els.btnHome.classList.add('d-none');
    els.btnNext.classList.add('d-none');
    els.btnEpubToc.classList.add('d-none');
    els.btnEpubPrev.classList.add('d-none');
    els.btnEpubNext.classList.add('d-none');

    if (state.mode !== 'none') {
      els.btnHome.classList.remove('d-none');
    }
    
    if (state.mode === 'wiki') {
      els.btnNext.classList.remove('d-none');
    } else if (state.mode === 'epub' && state.epub.book) {
      els.btnEpubToc.classList.remove('d-none');
      els.btnEpubPrev.classList.remove('d-none');
      els.btnEpubNext.classList.remove('d-none');
      
      els.btnEpubPrev.style.opacity = state.epub.currentIdx > 0 ? '1' : '0.3';
      els.btnEpubPrev.style.pointerEvents = state.epub.currentIdx > 0 ? 'auto' : 'none';
      
      els.btnEpubNext.style.opacity = state.epub.currentIdx < state.epub.book.chapters.length - 1 ? '1' : '0.3';
      els.btnEpubNext.style.pointerEvents = state.epub.currentIdx < state.epub.book.chapters.length - 1 ? 'auto' : 'none';
    }
  }

  async function renderContent(title, textContent, sourceInfo) {
    state.title = title;
    els.tabName.textContent = title + (state.mode === 'wiki' ? '.md' : '.txt');
    
    state.annotations = await DB.getAnnotations(title);
    
    // Split into lines
    const rawLines = textContent.split('\n');
    state.lines = [];
    
    // Generate JSDoc header
    const words = textContent.trim().split(/\s+/).length;
    const header = [
      `/**`,
      ` * @entry   ${title}`,
      ` * @source  ${sourceInfo}`,
      ` * @words   ~${words}`,
      ` */`,
      ``,
      `// ` + '─'.repeat(40),
      ``
    ];
    
    // Build final lines array
    state.lines = [...header];
    for (const rawLine of rawLines) {
      if (rawLine.trim() === '') {
        state.lines.push('');
      } else {
        // Simple word wrap (very naive, purely visual for long lines if needed, but CSS handles wrap)
        // Here we just keep paragraphs as single lines and let CSS wrap them, 
        // BUT for a true code editor feel, we should probably hard-wrap.
        // For simplicity and responsive mobile layout, CSS wrap is better, 
        // but we'll map 1 physical paragraph to 1 line number.
        state.lines.push(rawLine);
      }
    }

    // Render HTML with Highlighter
    let html = '';
    let gutterHtml = '';
    
    for (let i = 0; i < state.lines.length; i++) {
      const lineNum = i + 1;
      gutterHtml += `<div class="line-num">${lineNum}</div>`;
      
      const lineText = state.lines[i];
      if (lineText === '') {
        html += `<div style="min-height: 1.6em"></div>`;
      } else {
        const highlighted = Highlighter.highlight(lineText, state.lang);
        html += `<div>${highlighted}</div>`;
      }
      if (state.annotations[lineNum]) {
        html += `<div class="inline-annotation">// ${state.annotations[lineNum]}</div>`;
        gutterHtml += `<div class="line-num" style="height: 25px;"></div>`; // extra space for annotation in gutter
      }
    }

    els.gutter.innerHTML = gutterHtml;
    els.editorContent.innerHTML = html;
    
    els.splash.classList.add('hidden');
    updateHeaderControls();
    
    els.scrollArea.scrollTop = 0;
    updateProgress();
  }

  function updateProgress() {
    if (els.splash.classList.contains('hidden')) {
      const st = els.scrollArea.scrollTop;
      const sh = els.scrollArea.scrollHeight;
      const ch = els.scrollArea.clientHeight;
      
      let p = 0;
      if (sh > ch) {
        p = Math.round((st / (sh - ch)) * 100);
      } else {
        p = 100; // fits on one screen
      }
      
      p = Math.max(0, Math.min(100, p));
      state.progress = p;
      
      const barLen = 16;
      const filled = Math.round((p / 100) * barLen);
      const bar = '▓'.repeat(filled) + '░'.repeat(barLen - filled);
      
      els.progressText.textContent = `${p}%`;
      els.progressBar.textContent = bar;

      if (state.mode === 'epub' && state.epub.book) {
        DB.setSetting(`epub_scroll_${state.epub.book.title}_${state.epub.currentIdx}`, st);
      }
    }
  }

  els.scrollArea.addEventListener('scroll', () => requestAnimationFrame(updateProgress));

  // ── Actions ───────────────────────────────────────────────
  
  async function loadRandomWiki() {
    try {
      const selectedDomain = els.selectedTopicVal.value;
      setLoader(true, `> fetching ${state.lang.toUpperCase()} wiki (${selectedDomain})...`);
      state.mode = 'wiki';
      const entry = await Wikipedia.fetchRandom(state.lang, selectedDomain);
      
      // Fetch full text
      setLoader(true, `> fetching extract: ${entry.title}...`);
      const fullText = await Wikipedia.fetchFull(entry.title, state.lang);
      
      await renderContent(entry.title, fullText, entry.source);
      
      // Save history
      DB.addHistory(entry);
    } catch (e) {
      console.error(e);
      alert('Failed to load Wikipedia entry. Offline?');
      state.mode = 'none';
      updateHeaderControls();
    } finally {
      setLoader(false);
    }
  }

  async function loadEpubChapter(idx) {
    if (!state.epub.book || idx < 0 || idx >= state.epub.book.chapters.length) return;
    
    setLoader(true, `> loading chapter ${idx + 1}...`);
    state.epub.currentIdx = idx;
    await DB.setSetting(`epub_idx_${state.epub.book.title}`, idx);
    
    const chapter = state.epub.book.chapters[idx];
    const textContent = `// ── ${chapter.title || 'Chapter ' + (idx + 1)} ──\n\n${chapter.content}`;
    
    const chapterTitle = `${state.epub.book.title}__ch${idx}`;
    await renderContent(chapterTitle, textContent, `Local EPUB (Ch ${idx+1}/${state.epub.book.chapters.length})`);
    
    els.tabName.textContent = state.epub.book.title + `.epub [${idx+1}/${state.epub.book.chapters.length}]`;
    updateHeaderControls();
    
    const savedScroll = await DB.getSetting(`epub_scroll_${state.epub.book.title}_${idx}`) || 0;
    els.scrollArea.scrollTop = savedScroll;
    setLoader(false);
  }

  async function handleEpubUpload(file) {
    if (!file) return;
    try {
      setLoader(true, `> parsing EPUB: ${file.name}...`);
      state.mode = 'epub';
      
      const book = await EpubParser.parse(file);
      state.epub.book = book;
      
      DB.saveBook({ title: book.title, author: book.author, data: file });
      
      let savedIdx = await DB.getSetting(`epub_idx_${book.title}`) || 0;
      if (savedIdx >= book.chapters.length) savedIdx = 0;
      
      await loadEpubChapter(savedIdx);
      
    } catch (e) {
      console.error(e);
      alert('Failed to parse EPUB: ' + e.message);
      state.mode = 'none';
      updateHeaderControls();
    } finally {
      setLoader(false);
    }
  }

  // ── Event Listeners ───────────────────────────────────────
  
  els.btnNext.addEventListener('click', loadRandomWiki);
  
  els.btnHome.addEventListener('click', () => {
    els.splash.classList.remove('hidden');
    state.mode = 'none';
    updateHeaderControls();
    els.tabName.textContent = '~/welcome';
    els.editorContent.innerHTML = '';
    els.gutter.innerHTML = '';
    state.epub.book = null;
  });

  els.btnEpubPrev.addEventListener('click', () => loadEpubChapter(state.epub.currentIdx - 1));
  els.btnEpubNext.addEventListener('click', () => loadEpubChapter(state.epub.currentIdx + 1));
  
  els.btnEpubToc.addEventListener('click', () => {
    if (!state.epub.book) return;
    let html = '';
    state.epub.book.chapters.forEach((ch, i) => {
      const active = i === state.epub.currentIdx ? 'selected' : '';
      html += `<div class="cmd-item ${active}" data-idx="${i}">
                 <div class="cmd-title">${i + 1}. ${ch.title || 'Chapter ' + (i + 1)}</div>
               </div>`;
    });
    els.tocList.innerHTML = html;
    els.modalToc.classList.add('active');
  });

  els.modalToc.addEventListener('click', (e) => {
    if (e.target === els.modalToc) els.modalToc.classList.remove('active');
  });

  els.tocList.addEventListener('click', (e) => {
    const item = e.target.closest('.cmd-item');
    if (!item) return;
    const idx = parseInt(item.dataset.idx, 10);
    els.modalToc.classList.remove('active');
    loadEpubChapter(idx);
  });

  els.btnRandom.addEventListener('click', loadRandomWiki);
  
  els.btnUpload.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', (e) => {
    handleEpubUpload(e.target.files[0]);
    e.target.value = ''; // reset
  });

  els.langToggle.addEventListener('click', async () => {
    state.lang = state.lang === 'en' ? 'zh' : 'en';
    els.langToggle.textContent = state.lang.toUpperCase();
    await DB.setSetting('lang', state.lang);
    if (state.mode === 'wiki') {
      loadRandomWiki();
    }
  });

  // Topics Logic
  els.btnOpenTopics.addEventListener('click', () => {
    // Generate grid if empty
    if (!els.topicGrid.querySelector('.topic-tag')) {
      let html = `<div class="topic-tag" data-val="any">[ * ] ANY</div>`;
      for (const [key, config] of Object.entries(Wikipedia.DOMAINS)) {
        html += `<div class="topic-tag" data-val="${key}">[ ${key.toUpperCase()} ] ${config.name}</div>`;
      }
      els.topicGrid.innerHTML = html;
    }
    els.modalTopics.classList.add('active');
  });

  els.modalTopics.addEventListener('click', (e) => {
    if (e.target === els.modalTopics) els.modalTopics.classList.remove('active');
  });

  els.topicGrid.addEventListener('click', (e) => {
    const tag = e.target.closest('.topic-tag');
    if (!tag) return;
    
    const val = tag.dataset.val;
    els.selectedTopicVal.value = val;
    
    // Update label
    if (val === 'any') {
      els.currentTopicLabel.textContent = 'ANY';
    } else {
      els.currentTopicLabel.textContent = Wikipedia.DOMAINS[val].name;
    }
    
    els.modalTopics.classList.remove('active');
    
    // Uncheck "ANY" radio if user picked something else, or check it if they picked ANY
    const radioAny = document.querySelector('input[name="domain"][value="any"]');
    if (radioAny) radioAny.checked = (val === 'any');
  });

  // Annotation Logic
  els.gutter.addEventListener('click', (e) => {
    if (e.target.classList.contains('line-num')) {
      const lineNumStr = e.target.textContent;
      if (!lineNumStr) return; // skip empty gutter items for inline annotations
      state.currentLineNum = parseInt(lineNumStr, 10);
      els.annotateInput.value = state.annotations[state.currentLineNum] || '';
      els.modalAnnotate.classList.add('active');
      els.annotateInput.focus();
    }
  });

  els.modalAnnotate.addEventListener('click', (e) => {
    if (e.target === els.modalAnnotate) els.modalAnnotate.classList.remove('active');
  });

  els.annotateInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const text = els.annotateInput.value.trim();
      if (text) {
        await DB.saveAnnotation(state.title, state.currentLineNum, text);
      } else {
        // delete annotation if empty
        const db = await DB.getSetting('dummy'); // hacky way to init db connection
        // for MVP we can just overwrite with empty, or properly delete
      }
      els.modalAnnotate.classList.remove('active');
      // re-render to show annotation
      const source = state.mode === 'wiki' ? `Wikipedia ${state.lang.toUpperCase()}` : 'Local EPUB';
      // We need to re-render using the current lines array. Let's just reconstruct the textContent
      const textContent = state.lines.slice(8).join('\n'); // skip the 8-line header
      await renderContent(state.title, textContent, source);
    }
  });

  // Settings & Sync Logic
  els.btnSettings.addEventListener('click', () => {
    els.modalSettings.classList.add('active');
  });

  els.modalSettings.addEventListener('click', (e) => {
    if (e.target === els.modalSettings) els.modalSettings.classList.remove('active');
  });

  els.btnSaveSettings.addEventListener('click', async () => {
    await DB.setSetting('ghToken', els.settingToken.value.trim());
    await DB.setSetting('ghGist', els.settingGist.value.trim());
    els.modalSettings.classList.remove('active');
  });

  els.btnSync.addEventListener('click', async () => {
    const token = els.settingToken.value.trim();
    let gistId = els.settingGist.value.trim();
    if (!token) {
      alert('Please set your GitHub Personal Access Token in settings first.');
      return;
    }
    try {
      els.btnSync.textContent = '[ SYNCING... ]';
      const allAnnotations = await GistSync.getAllAnnotationsFromDB();
      if (allAnnotations.length === 0) {
        alert('No annotations to sync.');
        els.btnSync.textContent = '[ PUSH ]';
        return;
      }
      
      const res = await GistSync.push(token, gistId, allAnnotations);
      
      if (!gistId) {
        // If it was a new gist, save the new ID
        els.settingGist.value = res.id;
        await DB.setSetting('ghGist', res.id);
      }
      els.btnSync.textContent = '[ SYNCED ]';
      setTimeout(() => els.btnSync.textContent = '[ PUSH ]', 3000);
    } catch (err) {
      console.error(err);
      alert('Sync failed: ' + err.message);
      els.btnSync.textContent = '[ ERROR ]';
      setTimeout(() => els.btnSync.textContent = '[ PUSH ]', 3000);
    }
  });

  // Search Modal Logic
  els.btnSearch.addEventListener('click', () => {
    els.modalSearch.classList.add('active');
    els.searchInput.focus();
  });
  
  els.modalSearch.addEventListener('click', (e) => {
    if (e.target === els.modalSearch) els.modalSearch.classList.remove('active');
  });

  let searchTimeout;
  els.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const q = e.target.value.trim();
    if (!q) {
      els.searchResults.innerHTML = '';
      return;
    }
    
    searchTimeout = setTimeout(async () => {
      try {
        els.searchResults.innerHTML = '<div class="cmd-item"><div class="cmd-title">Searching...</div></div>';
        const results = await Wikipedia.search(q, state.lang);
        
        if (results.length === 0) {
          els.searchResults.innerHTML = '<div class="cmd-item"><div class="cmd-title">No results</div></div>';
          return;
        }
        
        els.searchResults.innerHTML = results.map(r => `
          <div class="cmd-item" data-title="${r.title}">
            <div class="cmd-title">${r.title}</div>
            <div class="cmd-desc">${r.description || '...'}</div>
          </div>
        `).join('');
      } catch (err) {
        els.searchResults.innerHTML = '<div class="cmd-item"><div class="cmd-title">Search error</div></div>';
      }
    }, 500);
  });

  els.searchResults.addEventListener('click', async (e) => {
    const item = e.target.closest('.cmd-item');
    if (!item) return;
    const title = item.dataset.title;
    if (!title) return;
    
    els.modalSearch.classList.remove('active');
    
    try {
      state.mode = 'wiki';
      setLoader(true, `> fetching extract: ${title}...`);
      const fullText = await Wikipedia.fetchFull(title, state.lang);
      await renderContent(title, fullText, `Wikipedia ${state.lang.toUpperCase()}`);
      DB.addHistory({ title, lang: state.lang, source: `Wikipedia ${state.lang.toUpperCase()}` });
    } catch (err) {
      console.error(err);
      alert('Failed to load article');
    } finally {
      setLoader(false);
    }
  });

});
