export default {
  async fetch(request, env) {
    let url = new URL(request.url);
    
    // Resolve directory paths to index.html
    if (url.pathname.endsWith('/')) {
      url.pathname += 'index.html';
      request = new Request(url, request);
    }

    let response = await env.ASSETS.fetch(request);

    // Ensure index.html is served as text/html to prevent download prompts
    if (url.pathname.endsWith('/index.html') && response.ok) {
      const headers = new Headers(response.headers);
      if (!headers.get('Content-Type') || headers.get('Content-Type').includes('application/octet-stream') || headers.get('Content-Type').includes('text/plain')) {
        headers.set('Content-Type', 'text/html; charset=utf-8');
        response = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        });
      }
    }

    return response;
  },
};
