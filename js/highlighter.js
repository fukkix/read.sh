/**
 * FIREADER — Syntax Highlighter
 * Makes plain text look like source code with semantic coloring.
 *
 * Colors:
 *   syn-tag    → purple  — JSDoc @tags
 *   syn-str    → green   — quoted strings / book titles
 *   syn-num    → orange  — numbers / years
 *   syn-name   → blue    — proper nouns / named entities
 *   syn-kw     → pink    — section headers
 *   syn-muted  → gray    — parentheticals / asides
 *   syn-comment→ dim     — comment lines (//)
 */
const Highlighter = (() => {

  function escHtml(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Token engine (prevents double-highlighting) ─────────────────
  function tokenize(html) {
    const tokens = [];
    const re = /(<span[^>]*>[\s\S]*?<\/span>)/g;
    let last = 0, m;
    while ((m = re.exec(html)) !== null) {
      if (m.index > last) tokens.push({ t: 'text', v: html.slice(last, m.index) });
      tokens.push({ t: 'span', v: m[0] });
      last = re.lastIndex;
    }
    if (last < html.length) tokens.push({ t: 'text', v: html.slice(last) });
    return tokens;
  }

  function applyPat(tokens, pat, cls) {
    const re = new RegExp(pat.source, pat.flags.includes('g') ? pat.flags : pat.flags + 'g');
    return tokens.flatMap(tok => {
      if (tok.t === 'span') return [tok];
      const parts = [];
      let last = 0, m;
      re.lastIndex = 0;
      while ((m = re.exec(tok.v)) !== null) {
        if (m.index > last) parts.push({ t: 'text', v: tok.v.slice(last, m.index) });
        parts.push({ t: 'span', v: `<span class="${cls}">${m[0]}</span>` });
        last = re.lastIndex;
        if (m[0].length === 0) re.lastIndex++;
      }
      if (last < tok.v.length) parts.push({ t: 'text', v: tok.v.slice(last) });
      return parts.length ? parts : [tok];
    });
  }

  function join(tokens) { return tokens.map(t => t.v).join(''); }

  // ── English highlighter ─────────────────────────────────────────
  function highlightEN(line) {
    const esc = escHtml(line);

    // Full-line comment
    if (/^\s*\/\//.test(line)) {
      // Highlight @tags inside comments too
      let toks = tokenize(esc);
      toks = applyPat(toks, /@\w+/, 'syn-tag');
      return `<span class="syn-comment">${join(toks)}</span>`;
    }

    // JSDoc block lines (/** ... */ or * ...)
    if (/^\s*\*/.test(line) || /^\s*\/\*\*?/.test(line)) {
      let toks = tokenize(esc);
      toks = applyPat(toks, /@\w+/, 'syn-tag');
      toks = applyPat(toks, /\b\d{4}\b/, 'syn-num');
      return `<span class="syn-comment">${join(toks)}</span>`;
    }

    let toks = tokenize(esc);

    // Section Headers (Wiki style or Markdown)
    toks = applyPat(toks, /^={2,4}\s+[^=]+\s+={2,4}$|^#{1,6}\s+.+$/, 'syn-kw');

    // Quoted strings (ASCII and curly)
    toks = applyPat(toks, /"[^"]{1,400}"|'[^']{1,400}'|“[^”]{1,400}”/, 'syn-str');
    // Years (1000–2099)
    toks = applyPat(toks, /\b(1[0-9]{3}|20[0-9]{2})\b/, 'syn-num');
    // Other numbers (integers, decimals, percentages)
    toks = applyPat(toks, /\b\d+(?:\.\d+)?(?:\s*%)?/, 'syn-num');
    // Proper nouns: 1–4 consecutive Title-Case words (min 3 chars each)
    toks = applyPat(toks, /\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,3}\b/, 'syn-name');
    // Parentheticals
    toks = applyPat(toks, /\([^)]{4,80}\)/, 'syn-muted');

    return join(toks);
  }

  // ── Chinese highlighter ─────────────────────────────────────────
  function highlightZH(line) {
    const esc = escHtml(line);

    if (/^\s*\/\//.test(line)) {
      let toks = tokenize(esc);
      toks = applyPat(toks, /@\w+/, 'syn-tag');
      return `<span class="syn-comment">${join(toks)}</span>`;
    }

    if (/^\s*\*/.test(line) || /^\s*\/\*\*?/.test(line)) {
      let toks = tokenize(esc);
      toks = applyPat(toks, /@\w+/, 'syn-tag');
      return `<span class="syn-comment">${join(toks)}</span>`;
    }

    let toks = tokenize(esc);

    // Section Headers
    toks = applyPat(toks, /^={2,4}\s+[^=]+\s+={2,4}$|^#{1,6}\s+.+$/, 'syn-kw');

    // Book/title brackets 《》
    toks = applyPat(toks, /《[^》]{1,30}》/, 'syn-str');
    // Quotes 「」or "" or “”
    toks = applyPat(toks, /「[^」]{1,400}」|“[^”]{1,400}”|"[^"]{1,400}"/, 'syn-str');
    // Numbers with optional CJK units
    toks = applyPat(toks, /\d+(?:\.\d+)?(?:\s*(?:年|月|日|世纪|%|亿|万|千|百))?/, 'syn-num');
    // Parentheticals （）
    toks = applyPat(toks, /（[^）]{1,60}）/, 'syn-muted');
    // English proper nouns embedded in Chinese text
    toks = applyPat(toks, /[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,3}/, 'syn-name');

    return join(toks);
  }

  function highlight(line, lang = 'en') {
    if (!line || !line.trim()) return '&nbsp;';
    return lang === 'zh' ? highlightZH(line) : highlightEN(line);
  }

  return { highlight };
})();
