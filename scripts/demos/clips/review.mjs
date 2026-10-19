// Clip: the code review. The diff shown is real: the recorder that captured this clip.
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDemo } from '../lib/fixture.mjs';

export const meta = { id: 'review', title: 'The code review' };
// A frame from the fullscreen review, used as the still in the Review chapter.
export const stills = [{ name: 'review-full', frame: 330 }];
const SITE = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const FILES = ['scripts/demos/lib/recorder.mjs', 'scripts/demos/clips/session.mjs'];

function realDiff() {
  return FILES.map((file) => {
    try { return execFileSync('git', ['diff', '--no-index', '--', '/dev/null', file], { cwd: SITE, encoding: 'utf8' }); }
    catch (error) { return error.stdout; }
  }).join('');
}

export async function record(wrapped, rec) {
  const f = await openDemo(wrapped, {
    diff: realDiff(),
    gitStatus: { is_git_repo: true, branch: 'design/real-app-20261016', staged: [], unstaged: FILES.map((path) => ({ path, status: 'A' })), untracked: [] },
  });
  const p = f.page;
  await p.getByText('Review the changes', { exact: true }).first().click();
  await p.getByText(/Activity · \d+ step/).first().waitFor();
  await p.waitForTimeout(600);

  const r = await rec(p, f.context);
  await r.start();
  await r.hold(1.0);
  await r.click(p.getByRole('button', { name: 'Review', exact: true }).first(), { duration: 0.8, after: 0.6 });
  await r.hold(0.8);
  const file = p.getByText(/recorder\.mjs/).first();
  await file.waitFor();
  await r.click(file, { duration: 0.8, after: 0.5 });
  await r.hold(1.0);
  const anchor = p.getByText('createRecorder').first();
  await anchor.waitFor();
  await r.scrollBy(anchor, 700, { duration: 1.2 });
  await r.hold(0.8);
  await r.click(p.getByRole('button', { name: 'Fullscreen', exact: true }), { duration: 0.8, after: 0.8 });
  await r.hold(0.8);
  const anchor2 = p.getByText('createRecorder').first();
  await anchor2.waitFor();
  await r.scrollBy(anchor2, 900, { duration: 1.4 });
  await r.hold(0.8);
  await r.click(p.getByRole('button', { name: 'Unified View', exact: true }), { duration: 0.8, after: 0.5 });
  await r.hold(2.6);
  await r.stop();
  return { fixture: f };
}
