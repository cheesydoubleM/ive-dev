// Clip: a focused session. A follow-up instruction is typed, the agent works through
// read → edit → test steps, and the reply lands. Everything rendered by the real app.
import { openDemo, pushAssistant } from '../lib/fixture.mjs';

export const meta = { id: 'session', title: 'A focused session' };

export async function record(wrapped, rec) {
  const f = await openDemo(wrapped);
  const p = f.page;
  await p.getByTitle('Open Build the workspace', { exact: true }).click();
  await p.getByText(/Activity · \d+ steps/).first().waitFor();
  await p.waitForTimeout(800);
  const r = await rec(p, f.context);
  await r.start();
  await r.hold(1.2);

  const composer = p.locator('.ive-session-composer textarea');
  await r.click(composer, { duration: 0.7, offset: { x: 0.25, y: 0.5 } });
  await r.type('Also add ⌘⇧T as the shortcut and mention it in the README.', { cps: 21 });
  await r.hold(0.5);
  await r.press('Enter', 0.3);
  await r.settle(300);
  await r.hold(1.4);

  const sid = 'interface';
  const steps = [
    [{ type: 'thinking', thinking: 'Shortcuts are registered in src/lib/keymap.js. ⌘⇧T is free. I’ll add the binding, document it, and run the tests.' }],
    [{ type: 'tool_use', id: 's1', name: 'Read', input: { file_path: 'src/lib/keymap.js' } }],
    [{ type: 'tool_result', tool_use_id: 's1', content: '58 lines. Bindings are a plain object keyed by chord.' }, { type: 'tool_use', id: 's2', name: 'Edit', input: { file_path: 'src/lib/keymap.js', description: 'Bind ⌘⇧T to toggleTheme' } }],
    [{ type: 'tool_result', tool_use_id: 's2', content: 'Edited 1 file: +3 −0' }, { type: 'tool_use', id: 's3', name: 'Edit', input: { file_path: 'README.md', description: 'Document the theme shortcut' } }],
    [{ type: 'tool_result', tool_use_id: 's3', content: 'Edited 1 file: +2 −0' }, { type: 'tool_use', id: 's4', name: 'Bash', input: { command: 'npm test', description: 'Run the test suite' } }],
    [{ type: 'tool_result', tool_use_id: 's4', content: '12 passed, 0 failed (3.1 s)' }],
    [{ type: 'text', text: 'Done. **⌘⇧T** now toggles the theme, the README lists it next to the other shortcuts, and all 12 tests pass.' }],
  ];
  const holds = [1.6, 1.2, 1.3, 1.2, 1.5, 1.0, 3.0];
  for (let i = 0; i < steps.length; i++) {
    pushAssistant(f, sid, steps[i], { done: i === steps.length - 1 });
    await p.evaluate((id) => window.dispatchEvent(new CustomEvent('cc-session-messages-refresh', { detail: { sessionId: id } })), sid);
    await r.settle(250);
    await r.hold(holds[i]);
  }
  await r.stop();
  return { fixture: f };
}
