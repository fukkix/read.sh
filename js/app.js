/**
 * FIREADER — Main Application Logic
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const els = {
    splash: document.getElementById('splash'),
    btnContinue: document.getElementById('btn-continue'),
    continueTitle: document.getElementById('continue-title'),
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
    btnUploadFolder: document.getElementById('btn-upload-folder'),
    fileInput: document.getElementById('file-input'),
    folderInput: document.getElementById('folder-input'),
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
    epub: { book: null, currentIdx: 0 },
    selectedTopics: [] // empty = ANY
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

  // Load last book
  const lastBook = await DB.getSetting('last_book');
  if (lastBook) {
    els.continueTitle.textContent = lastBook.title;
    els.btnContinue.classList.remove('d-none');
    els.btnContinue.addEventListener('click', async () => {
      setLoader(true, `> resuming ${lastBook.title}...`);
      state.epub.book = lastBook;
      state.mode = 'epub';
      els.splash.classList.add('hidden');
      let savedIdx = await DB.getSetting(`epub_idx_${lastBook.title}`) || 0;
      if (savedIdx >= lastBook.chapters.length) savedIdx = 0;
      await loadEpubChapter(savedIdx);
      setLoader(false);
    });
  }

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

  async function renderContent(title, textContent, sourceInfo, categories = []) {
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
      ` * @tags    ${categories.length > 0 ? categories.join(', ') : 'none'}`,
      ` * @length  ~${words} words`,
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
      // Pick a random domain from selected topics, or 'any' if none selected
      let domain = 'any';
      if (state.selectedTopics.length > 0) {
        domain = state.selectedTopics[Math.floor(Math.random() * state.selectedTopics.length)];
      }
      setLoader(true, `> fetching ${state.lang.toUpperCase()} wiki (${domain})...`);
      state.mode = 'wiki';
      
      const history = await DB.getHistory(500);
      const entry = await Wikipedia.fetchRandom(state.lang, domain, history);
      
      // Fetch full text
      setLoader(true, `> fetching extract: ${entry.title}...`);
      const fullRes = await Wikipedia.fetchFull(entry.title, state.lang);
      
      await renderContent(entry.title, fullRes.extract, entry.source, fullRes.categories);
      
      // Save history with domain
      entry.domain = domain;
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
      await DB.setSetting('last_book', book);
      
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

  async function handleMarkdownFile(file) {
    try {
      setLoader(true, `> parsing Markdown: ${file.name}...`);
      state.mode = 'epub'; // reuse epub chapter system
      
      const text = await MarkdownParser.readFileText(file);
      const parsed = MarkdownParser.parseFile(text, file.name);
      
      state.epub.book = {
        title: parsed.title,
        author: '',
        chapters: [{ title: parsed.title, content: parsed.content }]
      };
      
      await DB.setSetting('last_book', state.epub.book);
      
      await loadEpubChapter(0);
    } catch (e) {
      console.error(e);
      alert('Failed to parse Markdown: ' + e.message);
      state.mode = 'none';
      updateHeaderControls();
    } finally {
      setLoader(false);
    }
  }

  async function handleFolderUpload(files) {
    if (!files || files.length === 0) return;
    try {
      // Filter to .md files only
      const mdFiles = Array.from(files).filter(f =>
        f.name.endsWith('.md') && !f.name.startsWith('.')
      );
      
      if (mdFiles.length === 0) {
        alert('No Markdown files found in folder.');
        return;
      }
      
      setLoader(true, `> scanning vault: ${mdFiles.length} notes found...`);
      state.mode = 'epub';
      
      const bookData = MarkdownParser.parseFiles(mdFiles);
      if (!bookData) {
        alert('No readable .md files found.');
        state.mode = 'none';
        updateHeaderControls();
        setLoader(false);
        return;
      }
      
      // Read all file contents
      for (let i = 0; i < bookData.chapters.length; i++) {
        setLoader(true, `> reading ${i + 1}/${bookData.chapters.length}: ${bookData.chapters[i].title}...`);
        const text = await MarkdownParser.readFileText(bookData.chapters[i].file);
        const cleaned = MarkdownParser.cleanMarkdown(text);
        bookData.chapters[i].content = cleaned;
        delete bookData.chapters[i].file; // free reference
      }
      
      state.epub.book = bookData;
      await DB.setSetting('last_book', bookData);
      
      let savedIdx = await DB.getSetting(`epub_idx_${bookData.title}`) || 0;
      if (savedIdx >= bookData.chapters.length) savedIdx = 0;
      
      await loadEpubChapter(savedIdx);
    } catch (e) {
      console.error(e);
      alert('Failed to load vault: ' + e.message);
      state.mode = 'none';
      updateHeaderControls();
    } finally {
      setLoader(false);
    }
  }

  function handleFileUpload(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'epub') {
      handleEpubUpload(file);
    } else if (ext === 'md' || ext === 'markdown' || ext === 'txt') {
      handleMarkdownFile(file);
    } else {
      alert('Unsupported format. Use .epub or .md files.');
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
  els.btnUploadFolder.addEventListener('click', () => els.folderInput.click());
  
  els.fileInput.addEventListener('change', (e) => {
    handleFileUpload(e.target.files[0]);
    e.target.value = '';
  });
  
  els.folderInput.addEventListener('change', (e) => {
    handleFolderUpload(e.target.files);
    e.target.value = '';
  });

  els.langToggle.addEventListener('click', async () => {
    const oldLang = state.lang;
    const newLang = oldLang === 'en' ? 'zh' : 'en';
    
    if (state.mode === 'wiki' && state.title) {
      setLoader(true, `> translating to ${newLang.toUpperCase()}...`);
      try {
        const translatedTitle = await Wikipedia.fetchTranslation(state.title, oldLang, newLang);
        if (translatedTitle) {
          const fullRes = await Wikipedia.fetchFull(translatedTitle, newLang);
          await renderContent(translatedTitle, fullRes.extract, `Wikipedia ${newLang.toUpperCase()}`, fullRes.categories);
          
          // Switch state successfully
          state.lang = newLang;
          els.langToggle.textContent = state.lang.toUpperCase();
          await DB.setSetting('lang', state.lang);
          els.topicGrid.innerHTML = '';
          updateTopicLabel();
          DB.addHistory({ title: translatedTitle, lang: newLang, source: `Wikipedia ${newLang.toUpperCase()}` });
        } else {
          alert(`No ${newLang.toUpperCase()} translation found for "${state.title}".`);
        }
      } catch (err) {
        console.error(err);
        alert('Translation request failed.');
      } finally {
        setLoader(false);
      }
    } else {
      // Just switch language for UI
      state.lang = newLang;
      els.langToggle.textContent = state.lang.toUpperCase();
      await DB.setSetting('lang', state.lang);
      els.topicGrid.innerHTML = ''; // Force re-render of topics modal
      updateTopicLabel();
    }
  });

  // Topics Logic
  function updateTopicLabel() {
    if (state.selectedTopics.length === 0) {
      els.currentTopicLabel.textContent = 'ANY';
    } else if (state.selectedTopics.length === 1) {
      els.currentTopicLabel.textContent = Wikipedia.DOMAINS[state.selectedTopics[0]].name[state.lang];
    } else {
      els.currentTopicLabel.textContent = state.selectedTopics.length + ' TOPICS';
    }
  }

  function refreshTopicGridState() {
    els.topicGrid.querySelectorAll('.topic-tag').forEach(tag => {
      const val = tag.dataset.val;
      if (val === 'any') {
        tag.classList.toggle('active', state.selectedTopics.length === 0);
      } else {
        tag.classList.toggle('active', state.selectedTopics.includes(val));
      }
    });
  }

  els.btnOpenTopics.addEventListener('click', () => {
    // Generate grid if empty
    if (!els.topicGrid.querySelector('.topic-tag')) {
      let html = `<button class="topic-tag" data-val="any">[ * ] ANY</button>`;
      for (const [key, config] of Object.entries(Wikipedia.DOMAINS)) {
        html += `<button class="topic-tag" data-val="${key}">[ ${key.toUpperCase()} ] ${config.name[state.lang]}</button>`;
      }
      els.topicGrid.innerHTML = html;
    }
    refreshTopicGridState();
    els.modalTopics.classList.add('active');
  });

  els.modalTopics.addEventListener('click', (e) => {
    if (e.target === els.modalTopics) els.modalTopics.classList.remove('active');
  });

  els.topicGrid.addEventListener('click', (e) => {
    const tag = e.target.closest('.topic-tag');
    if (!tag) return;
    
    const val = tag.dataset.val;
    
    if (val === 'any') {
      // Clear all selections = ANY mode
      state.selectedTopics = [];
    } else {
      const idx = state.selectedTopics.indexOf(val);
      if (idx >= 0) {
        // Deselect
        state.selectedTopics.splice(idx, 1);
      } else {
        // Add to selection
        state.selectedTopics.push(val);
      }
    }
    
    refreshTopicGridState();
    updateTopicLabel();
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
      const fullRes = await Wikipedia.fetchFull(title, state.lang);
      await renderContent(title, fullRes.extract, `Wikipedia ${state.lang.toUpperCase()}`, fullRes.categories);
      DB.addHistory({ title, lang: state.lang, source: `Wikipedia ${state.lang.toUpperCase()}` });
    } catch (err) {
      console.error(err);
      alert('Failed to load article');
    } finally {
      setLoader(false);
    }
  });

});
