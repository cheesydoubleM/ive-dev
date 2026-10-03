const ALLOWED_ORIGINS = new Set(['https://ive.dev', 'https://www.ive.dev']);
const CONSENT_VERSION = '2026-10-03';
const MAX_BODY_BYTES = 4096;

function reply(request, status, message, ok = false) {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Vary': 'Origin',
    ...(ALLOWED_ORIGINS.has(request.headers.get('Origin')) ? { 'Access-Control-Allow-Origin': request.headers.get('Origin') } : {}),
    ...(status === 429 ? { 'Retry-After': '60' } : {})
  };
  if (request.headers.get('Accept')?.includes('application/json')) {
    return Response.json({ ok, ...(ok ? {} : { error: message }) }, { status, headers });
  }
  // Fixed text only: submitted personal information is never echoed into HTML.
  headers['Content-Type'] = 'text/html; charset=utf-8';
  headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${ok ? 'You’re on the list' : 'Beta signup'} — IVE</title><style>body{margin:0;background:#f4f5f6;color:#15171a;font:18px/1.6 system-ui,sans-serif}main{max-width:540px;margin:15vh auto;padding:32px}h1{font-size:42px;line-height:1.1;letter-spacing:-.04em}a{color:#0e36c7;text-underline-offset:4px}</style><main><p>IVE · BETA WAITLIST</p><h1>${ok ? 'You’re on the list.' : 'Let’s try that again.'}</h1><p>${message}</p><p><a href="https://ive.dev/#waitlist">Back to IVE →</a></p></main></html>`, { status, headers });
}

async function readBody(request) {
  if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY_BYTES) throw new Error('too-large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid');
  const parts = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error('too-large');
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return new TextDecoder().decode(bytes);
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/api/waitlist') return reply(request, 404, 'Page not found.');
    if (request.method === 'OPTIONS' && ALLOWED_ORIGINS.has(request.headers.get('Origin'))) {
      return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Origin': request.headers.get('Origin'),
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
        'Cache-Control': 'no-store',
        'Vary': 'Origin'
      } });
    }
    if (request.method !== 'POST') return reply(request, 405, 'Use the beta signup form to join the waitlist.');
    if (!ALLOWED_ORIGINS.has(request.headers.get('Origin'))) return reply(request, 403, 'Please use the signup form on ive.dev.');
    try {
      const { success } = await env.SIGNUP_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
      if (!success) return reply(request, 429, 'Please wait a minute before trying again.');
      const type = request.headers.get('Content-Type')?.split(';')[0].trim();
      if (!['application/json', 'application/x-www-form-urlencoded'].includes(type)) return reply(request, 415, 'Please use the signup form on ive.dev.');
      let data;
      try {
        const body = await readBody(request);
        data = type === 'application/json' ? JSON.parse(body) : Object.fromEntries(new URLSearchParams(body));
      } catch (error) {
        return reply(request, error.message === 'too-large' ? 413 : 400, 'Please check your entry and try again.');
      }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(request, 400, 'Please check your entry and try again.');
      const confirmation = 'Thanks for joining. We’ll email you when beta access is available.';
      if (data.company) return reply(request, 200, confirmation, true);
      const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
      const name = typeof data.name === 'string' ? data.name.trim() : '';
      if (email.length > 254 || !/^[^\s@\u0000-\u001f\u007f]+@[^\s@\u0000-\u001f\u007f]+\.[^\s@\u0000-\u001f\u007f]+$/.test(email) || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
        return reply(request, 400, 'Enter a valid email address and a name of up to 100 characters.');
      }
      if (data.consent !== true && data.consent !== 'yes') return reply(request, 400, 'Please agree to being contacted about IVE beta access.');
      await env.DB.prepare('INSERT INTO waitlist (email, name, consent_version) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING')
        .bind(email, name || null, CONSENT_VERSION).run();
      // Identical response for new and existing emails: never expose membership.
      return reply(request, 200, confirmation, true);
    } catch {
      // Do not log personal information or return internal database errors.
      return reply(request, 503, 'We couldn’t save your entry. Please try again shortly.');
    }
  },
  async scheduled(_event, env) {
    await env.DB.prepare("DELETE FROM waitlist WHERE created_at < datetime('now', '-12 months')").run();
  }
};
