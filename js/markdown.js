/**
 * FIREADER — Markdown Parser
 * Converts raw Markdown text to structured plain text for the reader.
 * Strips formatting syntax while preserving readable structure.
 */
const MarkdownParser = (() => {

  /**
   * Parse a single .md file into a chapter-like object.
   */
  function parseFile(text, filename) {
    const title = extractTitle(text) || filename.replace(/\.md$/i, '');
    const content = cleanMarkdown(text);
    return { title, content };
  }

  /**
   * Parse multiple .md files into a book-like structure.
   * Sorts by filename for predictable ordering.
   */
  function parseFiles(files) {
    const sorted = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));
    const chapters = [];
    let bookTitle = '';

    for (const file of sorted) {
      // skip hidden files and non-md
      if (file.name.startsWith('.') || !file.name.endsWith('.md')) continue;
      chapters.push({ file, title: file.name.replace(/\.md$/i, ''), content: null });
    }

    if (chapters.length === 0) return null;

    // Use parent folder name as book title if available via webkitRelativePath
    if (sorted[0]?.webkitRelativePath) {
      const parts = sorted[0].webkitRelativePath.split('/');
      if (parts.length > 1) bookTitle = parts[0];
    }

    if (!bookTitle) {
      bookTitle = chapters.length === 1
        ? chapters[0].title
        : 'Markdown Collection';
    }

    return { title: bookTitle, author: '', chapters };
  }

  /**
   * Read file content as text.
   */
  function readFileText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Extract the first heading as title.
   */
  function extractTitle(text) {
    const match = text.match(/^#{1,3}\s+(.+)$/m);
    return match ? match[1].trim() : '';
  }

  /**
   * Strip Markdown syntax while keeping readable structure.
   */
  function cleanMarkdown(text) {
    let out = text;

    // Remove YAML frontmatter
    out = out.replace(/^---[\s\S]*?---\n*/m, '');

    // Convert headings to plain text with separator
    out = out.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, title) => {
      return '\n' + title + '\n' + '\u2500'.repeat(Math.min(title.length, 40));
    });

    // Remove image syntax, keep alt text
    out = out.replace(/!\[([^\]]*)\]\([^)]*\)/g, '[$1]');

    // Remove link syntax, keep text
    out = out.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

    // Remove inline code backticks
    out = out.replace(/`([^`]+)`/g, '$1');

    // Remove code block fences
    out = out.replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
    });

    // Remove bold/italic markers
    out = out.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
    out = out.replace(/\*\*(.+?)\*\*/g, '$1');
    out = out.replace(/\*(.+?)\*/g, '$1');
    out = out.replace(/__(.+?)__/g, '$1');
    out = out.replace(/_(.+?)_/g, '$1');

    // Remove strikethrough
    out = out.replace(/~~(.+?)~~/g, '$1');

    // Convert blockquotes
    out = out.replace(/^>\s?/gm, '  ');

    // Convert list markers to plain dashes
    out = out.replace(/^(\s*)[-*+]\s/gm, '$1- ');
    out = out.replace(/^(\s*)\d+\.\s/gm, '$1- ');

    // Remove horizontal rules
    out = out.replace(/^[-*_]{3,}$/gm, '\u2500'.repeat(40));

    // Remove Obsidian wiki-links [[target|display]] or [[target]]
    out = out.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
    out = out.replace(/\[\[([^\]]+)\]\]/g, '$1');

    // Remove Obsidian tags
    out = out.replace(/#([a-zA-Z\u4e00-\u9fff][\w\u4e00-\u9fff/]*)/g, '$1');

    // Remove callout syntax
    out = out.replace(/^>\s*\[!(\w+)\]\s*/gm, '[$1] ');

    // Collapse multiple blank lines
    out = out.replace(/\n{3,}/g, '\n\n');

    return out.trim();
  }

  return { parseFile, parseFiles, readFileText, cleanMarkdown };
})();
