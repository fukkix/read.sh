/**
 * FIREADER — GitHub Gist Sync Module
 */
const GistSync = (() => {
  const GITHUB_API = 'https://api.github.com/gists';
  
  async function push(token, gistId, annotations) {
    if (!token) throw new Error('No GitHub Token provided');
    
    // Convert array of all annotations to a structured JSON string
    const content = JSON.stringify(annotations, null, 2);
    
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
