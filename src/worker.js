// Math Star Worker.
// v1 is a static site: every page lives in ./public and progress is kept on the device
// (localStorage, per child profile). The Worker only answers /api/* so there is a clear
// place to add D1-backed sync later, the same way English Star grew its multi-user API.

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ ok: true, service: 'math-star', storage: 'device' }), { headers: JSON_HEADERS });
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ ok: false, error: 'not_found' }), { status: 404, headers: JSON_HEADERS });
    }

    return env.ASSETS.fetch(request);
  }
};
