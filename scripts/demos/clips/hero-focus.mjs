// The real IVE 1.0.17 frontend, on its isolated Orbit demo transport.
// Two light-theme sessions on desktop; one complete real board tile in the phone cut.
// One action: allow npm test, watch the session continue, then see its result.
// Provenance: IVE app · demo project · no provider ran.
import { openDemo, agentStep, session, msg, blocks, permissionAttention, PERMISSION_SCREEN } from '../lib/fixture.mjs';

export const meta = { id: 'hero-focus', title: 'One decision, work continues', seconds: 14 };
export const encoding = {
  loopFade: 0.5,
  poster: 'poster',
  crf: 18,
  crfSmall: 19,
  crfCrop: 19,
};

// 880px inline becomes396px tall. The phone cut frames a complete single-session
// tile in a narrow real app window; no UI is redrawn or hidden with injected CSS.
const DESKTOP = { width: 1600, height: 720 };
const PHONE = { width: 768, height: 760 };
const FPS = 60;
const TARGET_FRAMES = 14 * FPS;

export async function record(wrapped, rec, { phone = false } = {}) {
  const checks = session('checks', 'Run sign-in checks', 'claude', 'sonnet', 'waiting', { attention: permissionAttention() });
  const api = session('api', 'Connect the API', 'codex', 'default', 'running');
  const sessions = phone ? [checks] : [api, checks];
  const messages = {
    checks: [
      ...(phone ? [] : [msg('checks', 'user', 'Run the sign-in checks.', 2)]),
      msg('checks', 'assistant', 'I need permission to run npm test.', 1),
    ],
    api: [
      msg('api', 'user', 'Connect the session list to the API.', 2),
      msg('api', 'assistant', blocks([
        { type: 'tool_use', id: 'focus-api-edit', name: 'Edit', input: { file_path: 'src/lib/api.js', description: 'Connect the session list' } },
      ]), 1),
    ],
  };
  const f = await openDemo(wrapped, {
    theme: 'light',
    viewport: phone ? PHONE : DESKTOP,
    sessions,
    messages,
    outputScreens: { checks: PERMISSION_SCREEN },
    workspacePatch: { human_oversight: 'full_auto' },
    storage: {
      'ive.sidebar-visible': phone ? 'true' : 'false',
      'cc-gridColumns': phone ? '1' : '2',
      'cc-gridLayout': 'equal',
      'ive.operator-desk': {
        activeWorkspaceId: 'orbit', activeSessionId: 'checks',
        openTabs: phone ? ['checks'] : ['api', 'checks'],
        showHome: false, sessionFocus: false,
      },
    },
  });
  const p = f.page;
  let approved = false;
  await f.context.route('**/api/sessions/checks/input', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await route.fulfill({ json: { ok: true, state: 'sent', session_id: 'checks' } });
    f.screens.checks = '❯ ';
    const item = f.data.sessions.find((s) => s.id === 'checks');
    item.attention = null;
    f.controls.broadcast({ type: 'session_attention', session_id: 'checks', attention: null });
    f.controls.setSessionStatus('checks', 'running');
    approved = true;
  });
  // Resuming a session's PTY can initially report idle; restore the authored demo state.
  if (!phone) f.controls.setSessionStatus('api', 'running');
  f.controls.setSessionStatus('checks', 'waiting', { attention: permissionAttention() });
  const allow = p.getByRole('button', { name: 'Allow once', exact: true });
  await allow.waitFor({ state: 'visible' });
  await p.waitForTimeout(600);
  if (!phone && await p.locator('#ive-project-sidebar').isVisible()) throw new Error('Desktop focus recording must hide the sidebar using the real app preference');
  await p.locator('[data-board-screen]').waitFor({ state: 'visible' });
  // The phone camera frames this complete tile, excluding the surrounding sidebar/app bar.
  const phoneBox = phone ? await p.locator('[data-board-screen] [data-terminal-grid]').boundingBox() : null;
  const phoneCrop = phoneBox ? { x: Math.round(phoneBox.x * 2), y: Math.round(phoneBox.y * 2), w: Math.round(phoneBox.width * 2), h: Math.round(phoneBox.height * 2) } : null;
  if (phone && (!phoneCrop || phoneCrop.w < 600 || phoneCrop.h < 800)) throw new Error('Phone needs one complete, readable board tile');
  const viewport = p.viewportSize();
  const button = await allow.boundingBox();
  const permissionCard = await p.locator('[data-session-prompt-actions]').filter({ has: allow }).boundingBox();
  if (phone && (!permissionCard || permissionCard.x < phoneBox.x || permissionCard.y < phoneBox.y || permissionCard.x + permissionCard.width > phoneBox.x + phoneBox.width || permissionCard.y + permissionCard.height > phoneBox.y + phoneBox.height)) {
    throw new Error('Phone camera must contain the entire permission card, not only its button');
  }
  if (!button || button.x < 0 || button.y < 0 || button.x + button.width > viewport.width || button.y + button.height > viewport.height) {
    throw new Error('The complete approval action must be inside the native capture');
  }
  const park = phone ? [viewport.width - 40, viewport.height - 70] : [viewport.width - 60, viewport.height - 90];
  const r = await rec(p, f.context, { fps: FPS, park });
  await r.start();
  await r.hold(0.4);
  await r.snap('poster');
  await r.hold(1.6);
  r.mark('approval');
  await r.click(allow, { duration: 1.2, after: 0.6 });
  await r.until(() => approved && allow.isHidden(), { maxSeconds: 2, label: 'permission accepted' });
  r.mark('running');
  await agentStep(f, 'checks', [
    { type: 'tool_use', id: 'focus-checks-test', name: 'Bash', input: { command: 'npm test', description: 'Run sign-in checks' } },
  ]);
  await r.hold(2.6);
  if (!phone) {
    await agentStep(f, 'api', [
      { type: 'tool_result', tool_use_id: 'focus-api-edit', content: 'Updated the session-list API client.' },
      { type: 'tool_use', id: 'focus-api-read', name: 'Read', input: { file_path: 'src/hooks/useWebSocket.js' } },
    ]);
  }
  await r.hold(1.2);
  await agentStep(f, 'checks', [
    { type: 'tool_result', tool_use_id: 'focus-checks-test', content: '3 passed, 0 failed.' },
  ]);
  await r.hold(0.8);
  r.mark('complete');
  await agentStep(f, 'checks', [
    { type: 'text', text: 'All three sign-in checks pass.' },
  ], { done: true });
  await r.hold(1.4);
  await r.moveTo(park, { duration: 1.0 });
  if (r.frameCount > TARGET_FRAMES) throw new Error('Focus scene exceeded its14-second budget');
  await r.frame(TARGET_FRAMES - r.frameCount);
  await r.stop();

  if (!phone) return { fixture: f };
  // Phone settings are returned explicitly: the shared runner otherwise defaults crops to CRF25.
  return { fixture: f, encoding: {
    loopFade: 0.5,
    crfCrop: 19,
    crops: [{ suffix: '-m', ...phoneCrop, poster: 'poster', crf: 19 }],
  } };
}
