import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from './index.mjs';

function fixture() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  return { sql, env: {
    SIGNUP_LIMITER: { limit: async () => ({ success: true }) },
    DB: { prepare: query => ({ bind: (...args) => ({ run: async () => sql.prepare(query).run(...args) }), run: async () => sql.prepare(query).run() }) }
  } };
}
const valid = { name: 'Test Person', email: 'Tester@example.com', consent: true, company: '' };
function request(data = valid, headers = {}) {
  return new Request('https://ive.dev/api/waitlist', { method: 'POST', headers: { Origin: 'https://ive.dev', Accept: 'application/json', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
}
test('saves a consented entry and deduplicates without overwriting the original', async () => {
  const { sql, env } = fixture();
  assert.equal((await worker.fetch(request(), env)).status, 200);
  assert.equal((await worker.fetch(request({ ...valid, name: 'Changed' }), env)).status, 200);
  const rows = sql.prepare('SELECT * FROM waitlist').all();
  assert.equal(rows.length, 1); assert.equal(rows[0].name, 'Test Person');
  assert.equal(rows[0].email, 'tester@example.com'); assert.equal(rows[0].consent_version, '2026-10-03');
  sql.close();
});
test('rejects invalid email, missing consent, foreign origins and large payloads without saving', async () => {
  const { sql, env } = fixture();
  for (const data of [{ ...valid, email: 'invalid' }, { ...valid, consent: false }, { ...valid, name: 'x'.repeat(101) }, null, []]) {
    assert.equal((await worker.fetch(request(data), env)).status, 400);
  }
  assert.equal((await worker.fetch(request(valid, { Origin: 'https://elsewhere.example' }), env)).status, 403);
  assert.equal((await worker.fetch(request({ ...valid, name: 'x'.repeat(5000) }), env)).status, 413);
  assert.equal(sql.prepare('SELECT count(*) AS count FROM waitlist').get().count, 0); sql.close();
});
test('honeypot reports success without writing, rate limit blocks, storage failure reports failure', async () => {
  const { sql, env } = fixture();
  assert.equal((await worker.fetch(request({ ...valid, company: 'bot' }), env)).status, 200);
  assert.equal(sql.prepare('SELECT count(*) AS count FROM waitlist').get().count, 0);
  assert.equal((await worker.fetch(request(), { ...env, SIGNUP_LIMITER: { limit: async () => ({ success: false }) } })).status, 429);
  assert.equal((await worker.fetch(request(), { ...env, DB: { prepare() { throw new Error('private internal detail'); } } })).status, 503);
  sql.close();
});
test('normal HTML form works without JavaScript and GET cannot reveal entries', async () => {
  const { sql, env } = fixture();
  const req = new Request('https://ive.dev/api/waitlist', { method: 'POST', headers: { Origin: 'https://ive.dev' }, body: new URLSearchParams({ name: '', email: 'nojs@example.com', consent: 'yes' }) });
  const response = await worker.fetch(req, env);
  assert.equal(response.status, 200); assert.match(await response.text(), /You’re on the list/);
  assert.equal(sql.prepare('SELECT name FROM waitlist').get().name, null);
  assert.equal((await worker.fetch(new Request('https://ive.dev/api/waitlist'), env)).status, 405);
  sql.close();
});
test('retention removes entries older than 12 months and keeps current signups', async () => {
  const { sql, env } = fixture();
  sql.exec("INSERT INTO waitlist(email,created_at,consent_version) VALUES ('old@example.com',datetime('now','-13 months'),'test'),('recent@example.com',datetime('now'),'test')");
  await worker.scheduled({}, env);
  assert.equal(sql.prepare('SELECT email FROM waitlist').get().email, 'recent@example.com'); sql.close();
});
test('CORS permits only the production website, including preflight and errors', async () => {
  const { sql, env } = fixture();
  const preflight = new Request('https://example.workers.dev/api/waitlist', { method: 'OPTIONS', headers: { Origin: 'https://ive.dev' } });
  const response = await worker.fetch(preflight, env);
  assert.equal(response.status, 204); assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://ive.dev');
  const foreign = await worker.fetch(request(valid, { Origin: 'https://elsewhere.example' }), env);
  assert.equal(foreign.headers.get('Access-Control-Allow-Origin'), null);
  const invalid = await worker.fetch(request({ ...valid, consent: false }), env);
  assert.equal(invalid.status, 400); assert.equal(invalid.headers.get('Access-Control-Allow-Origin'), 'https://ive.dev');
  sql.close();
});
