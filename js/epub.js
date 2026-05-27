/**
 * FIREADER — EPUB Parser
 * Uses JSZip to read EPUB (ZIP) files and extract chapters as plain text.
 */
const EpubParser = (() => {

  async function parse(file) {
    if (typeof JSZip === 'undefined') throw new Error('JSZip not loaded');

    const zip = await JSZip.loadAsync(file);

    // 1. Find OPF path from META-INF/container.xml
    const containerXml = await zip.file('META-INF/container.xml')?.async('text');
    if (!containerXml) throw new Error('Invalid EPUB: missing container.xml');

    const opfMatch = containerXml.match(/full-path="([^"]+\.opf)"/i);
    if (!opfMatch) throw new Error('Invalid EPUB: cannot find OPF path');

    const opfPath = opfMatch[1];
    const opfDir  = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

    // 2. Parse OPF
    const opfXml = await zip.file(opfPath)?.async('text');
    if (!opfXml) throw new Error('Invalid EPUB: missing OPF file');

    const parser = new DOMParser();
    const opf    = parser.parseFromString(opfXml, 'application/xml');

    const title  = opf.querySelector('metadata title, dc\\:title')?.textContent?.trim() || file.name.replace(/\.epub$/i, '');
    const author = opf.querySelector('metadata creator, dc\\:creator')?.textContent?.trim() || '';

    // 3. Build manifest map { id → { href, mediaType } }
    const manifest = {};
    opf.querySelectorAll('manifest item').forEach(item => {
      manifest[item.getAttribute('id')] = {
        href:      item.getAttribute('href') || '',
        mediaType: item.getAttribute('media-type') || ''
      };
    });

    // 4. Follow spine order
    const spineIds = Array.from(opf.querySelectorAll('spine itemref'))
      .map(el => el.getAttribute('idref'))
      .filter(Boolean);

    // 5. Extract chapters
    const chapters = [];

    for (const id of spineIds) {
      const item = manifest[id];
      if (!item) continue;

      const mt = item.mediaType || '';
      if (!mt.includes('html') && !mt.includes('xhtml')) continue;

      // Resolve path (href may be relative to OPF dir)
      const rawHref = decodeURIComponent(item.href);
      // Strip fragment
      const hrefNoFrag = rawHref.split('#')[0];
      const chapterPath = opfDir + hrefNoFrag;

      const html = await zip.file(chapterPath)?.async('text');
      if (!html) continue;

      const doc = parser.parseFromString(html, 'text/html');

      // Remove boilerplate elements
      doc.querySelectorAll('script, style, nav, aside, figure').forEach(el => el.remove());

      // Extract chapter heading
      const heading = doc.querySelector('h1, h2, h3')?.textContent?.trim() || '';

      // Extract paragraphs in reading order
      const paragraphs = [];
      doc.querySelectorAll('p, h1, h2, h3, h4, h5, blockquote, li').forEach(el => {
        const text = el.textContent.trim().replace(/\s+/g, ' ');
        if (text.length > 1) paragraphs.push(text);
      });

      // Fallback: use body text
      if (!paragraphs.length) {
        const bodyText = (doc.body?.textContent || '').replace(/\s+/g, ' ').trim();
        if (bodyText.length > 10) paragraphs.push(bodyText);
      }

      if (!paragraphs.length) continue;

      chapters.push({
        title:   heading,
        content: paragraphs.join('\n\n')
      });
    }

    if (!chapters.length) throw new Error('No readable chapters found in EPUB');

    return { title, author, chapters };
  }

  return { parse };
})();
