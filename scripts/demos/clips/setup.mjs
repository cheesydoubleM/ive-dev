// Clip: models and modes. Switch the model and the agent mode of one session, then
// reach anything with ⌘K.
import { openDemo } from '../lib/fixture.mjs';

export const meta = { id: 'setup', title: 'Models and modes' };

export async function record(wrapped, rec) {
  const f = await openDemo(wrapped);
  const p = f.page;
  await p.getByTitle('Open Build the workspace', { exact: true }).click();
  await p.getByText(/Activity · \d+ step/).first().waitFor();
  await p.waitForTimeout(600);

  const r = await rec(p, f.context);
  await r.start();
  await r.hold(1.0);
  const modelChip = p.locator('button', { hasText: /^Model:/ }).first();
  await r.click(modelChip, { duration: 0.8, after: 0.7 });
  const opus = p.getByText(/^Opus · opus/).first();
  await opus.waitFor();
  await r.click(opus, { duration: 0.7, after: 0.4 });
  await r.hold(1.0);
  const modeChip = p.locator('button', { hasText: /^Agent mode:/ }).first();
  await r.click(modeChip, { duration: 0.8, after: 0.7 });
  const plan = p.getByText('Plan', { exact: true }).first();
  await plan.waitFor();
  await r.click(plan, { duration: 0.7, after: 0.4 });
  // The mode menu stays open after a choice; close it before moving on.
  await r.press('Escape', 0.2);
  await r.moveTo([900, 620], { duration: 0.5 });
  await r.hold(0.9);
  await r.press('Meta+k', 0.8);
  await r.type('term', { cps: 10 });
  await r.hold(1.6);
  await r.press('Escape', 0.2);
  await r.hold(2.4);
  await r.stop();
  return { fixture: f };
}
