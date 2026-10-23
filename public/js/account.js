// Parent sign-in and cloud saving — the same model as English Star.
// A parent signs in with English Star's Clerk app; the family's children (shared with
// English Star) appear here, and each child's math progress is saved to the server.
// Without sign-in, nothing here runs and progress stays on the device.
import './parent-pin.js'; // defines window.ParentPin (English Star's PIN keypad)

const CLERK_FAPI = 'https://legible-ibex-1897.clerk.accounts.dev';
const CLERK_PK = 'pk_test_bGVnaWJsZS1pYmV4LTE4OTcuY2xlcmsuYWNjb3VudHMuZGV2JA';
const SIGNED_KEY = 'mathStarSignedIn'; // hint only: "a parent signed in on this device before"

const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } };

export const wasSignedIn = () => lsGet(SIGNED_KEY) === '1';

function addScript(src, attrs = {}) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.crossOrigin = 'anonymous';
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    s.onload = resolve; s.onerror = () => reject(new Error('could not load ' + src));
    document.head.append(s);
  });
}

let clerkPromise = null;
export function loadClerk() {
  if (!clerkPromise) {
    clerkPromise = (async () => {
      await Promise.all([
        addScript(`${CLERK_FAPI}/npm/@clerk/ui@1/dist/ui.browser.js`),
        addScript(`${CLERK_FAPI}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, { 'data-clerk-publishable-key': CLERK_PK })
      ]);
      await window.Clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });
      lsSet(SIGNED_KEY, window.Clerk.isSignedIn ? '1' : null);
      return window.Clerk;
    })();
    clerkPromise.catch(() => { clerkPromise = null; });
  }
  return clerkPromise;
}

// Resolves to Clerk when a parent is signed in, otherwise null. Never throws.
export async function signedInClerk({ timeoutMs = 12000 } = {}) {
  try {
    const clerk = await Promise.race([loadClerk(), new Promise((_, r) => setTimeout(() => r(new Error('timeout')), timeoutMs))]);
    return clerk.isSignedIn ? clerk : null;
  } catch { return null; }
}

let lastToken = null;
async function rawFetch(url, options = {}) {
  const clerk = await loadClerk();
  const token = await clerk.session?.getToken();
  lastToken = token || lastToken;
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', 'Bearer ' + token);
  return fetch(url, { ...options, headers });
}

export class ApiError extends Error {
  constructor(status, data) { super(data?.message || data?.error || 'Request failed: ' + status); this.status = status; this.data = data; }
}

// JSON API call. Parent actions go through ParentPin, which asks for the PIN when the server requires it.
export async function api(url, { method = 'GET', body, parent = false } = {}) {
  const options = { method, headers: body !== undefined ? { 'Content-Type': 'application/json' } : {}, body: body !== undefined ? JSON.stringify(body) : undefined };
  const res = parent ? await window.ParentPin.request(rawFetch, url, options) : await rawFetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export async function signOut() {
  lsSet(SIGNED_KEY, null);
  const clerk = await loadClerk().catch(() => null);
  await clerk?.signOut();
}

export function mountSignIn(el) {
  return loadClerk().then((clerk) => {
    clerk.mountSignIn(el, { forceRedirectUrl: location.origin + '/index.html?signedin=1', signUpForceRedirectUrl: location.origin + '/index.html?signedin=1' });
    clerk.addListener(({ session }) => { if (session) { lsSet(SIGNED_KEY, '1'); location.href = 'index.html?signedin=1'; } });
    return clerk;
  });
}

export const parentEmail = () => window.Clerk?.user?.primaryEmailAddress?.emailAddress || '';

// ---------------------------------------------------------------------------
// Saving a child's progress: latest state wins, saved right after each change,
// retried on failure, and flushed with keepalive when the page is closed.
// ---------------------------------------------------------------------------
export function makeSaver(childId, { onError, onSaved } = {}) {
  const url = `/api/math/children/${encodeURIComponent(childId)}/state`;
  let pending = null, inFlight = false, timer = null, failures = 0, warned = false;

  async function flush() {
    timer = null;
    if (inFlight || pending === null) return;
    const body = pending; pending = null; inFlight = true;
    try {
      const res = await rawFetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body });
      if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
      failures = 0; if (warned) { warned = false; onSaved?.(); }
    } catch (e) {
      if (pending === null) pending = body; // keep the newest unsaved copy
      failures++;
      if (!warned) { warned = true; onError?.(e); }
      if (!(e instanceof ApiError && [400, 404, 413].includes(e.status))) timer = setTimeout(flush, Math.min(30000, 1500 * 2 ** failures));
    } finally {
      inFlight = false;
      if (pending !== null && !timer) timer = setTimeout(flush, 300);
    }
  }

  const save = (kid) => {
    pending = JSON.stringify({ state: kid });
    if (!timer) timer = setTimeout(flush, 150);
  };

  // Finish saving before following a link, so the next page never reads an older copy.
  const settle = async (maxMs = 2000) => {
    const until = Date.now() + maxMs;
    while ((pending !== null || inFlight) && Date.now() < until) {
      if (!inFlight && pending !== null) { clearTimeout(timer); timer = null; flush(); }
      await new Promise((r) => setTimeout(r, 50));
    }
  };
  document.addEventListener('click', async (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a || a.target || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (pending === null && !inFlight) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    await settle();
    location.href = url.href;
  }, true);

  // Back button / closing the tab: last-chance save that survives the page going away.
  addEventListener('pagehide', () => {
    if (pending === null || !lastToken) return;
    try {
      fetch(url, { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + lastToken }, body: pending });
      pending = null;
    } catch { /* best effort */ }
  });

  return { save, flush: settle, hasPending: () => pending !== null || inFlight };
}
