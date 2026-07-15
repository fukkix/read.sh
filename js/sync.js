/**
 * FIREADER — GitHub Gist Sync Module
 */
const GistSync = (() => {
  const GITHUB_API = 'https://api.github.com/gists';
  
  async function push(token, gistId, annotations) {
    if (!token) throw new Error('No GitHub Token provided');

    // Group annotations by bookId for a structured, navigable gist
    const byBook = {};
    for (const a of annotations) {
      const key = a.bookId || '(unknown)';
      if (!byBook[key]) byBook[key] = [];
      byBook[key].push({ line: a.lineNum, text: a.text, ts: a.timestamp });
    }
    const payload = {
      schema: 'fireader-annotations-v1',
      syncedAt: new Date().toISOString(),
      count: annotations.length,
      books: byBook
    };
    const content = JSON.stringify(payload, null, 2);

    const files = {
      "fireader_annotations.json": { content }
    };

    if (gistId) {
      // Update existing gist
      const res = await fetch(`${GITHUB_API}/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ files })
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      return await res.json();
    } else {
      // Create new gist
      const res = await fetch(GITHUB_API, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          description: 'FIREADER Annotations Sync',
          public: false,
          files
        })
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      return await res.json();
    }
  }

  // Gets ALL annotations from DB
  async function getAllAnnotationsFromDB() {
    return await DB.getAllAnnotationsDump();
  }

  return { push, getAllAnnotationsFromDB };
})();
