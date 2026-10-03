import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const output = resolve(process.argv[2] || `waitlist-exports/ive-beta-${new Date().toISOString().slice(0, 10)}.csv`);
const raw = execFileSync('npx', ['--no-install', 'wrangler', 'd1', 'execute', 'ive-beta-waitlist', '--remote', '--json', '--command', "SELECT name, email, created_at, consent_version FROM waitlist WHERE created_at >= datetime('now', '-12 months') ORDER BY created_at ASC"], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const result = JSON.parse(raw);
if (!Array.isArray(result) || result.some(item => item.success !== true)) throw new Error('Export failed');
const rows = result.flatMap(item => item.results || []);
// Escape spreadsheet formula prefixes as well as CSV quotes.
const cell = value => {
  let s = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
};
const columns = ['name', 'email', 'created_at', 'consent_version'];
mkdirSync(dirname(output), { recursive: true, mode: 0o700 });
writeFileSync(output, '\uFEFF' + [columns.join(','), ...rows.map(row => columns.map(key => cell(row[key])).join(','))].join('\r\n') + '\r\n', { mode: 0o600, flag: 'wx' });
console.log(`Exported ${rows.length} entries to ${output}`);
