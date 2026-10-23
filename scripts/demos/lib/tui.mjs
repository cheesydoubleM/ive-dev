// Scripted CLI output for the terminal recordings. The real IVE frontend renders it in its own
// xterm terminals; the text arrives through the test transport's PTY channel (`output` events),
// the way a CLI's output would. Nothing here runs a provider or a CLI: every line is demo data
// written to look like a coding CLI's transcript for the Orbit story (a Claude Code-style
// transcript with ⏺ tool lines and the bordered prompt box, a Codex-style one with › and •).
// Provenance for every clip stays: IVE app · demo project · no provider ran.

const ESC = '\x1b[';
export const G = `${ESC}32m`, D = `${ESC}2m`, B = `${ESC}1m`, Y = `${ESC}33m`, R = `${ESC}0m`;
export const CLEAR = `${ESC}2J${ESC}3J${ESC}H`;

/**
 * One terminal screen: content lines that scroll up, and a tail (spinner, prompt box, hint)
 * that is redrawn in place at the bottom, like a TUI does. `render()` returns the escape
 * sequence that takes the terminal from its last state to the new one: cursor to the top of
 * the old tail, erase to the end of the screen, new content, new tail, cursor into the box.
 */
export function createScreen({ cols = 80, style = 'claude' } = {}) {
  let tailLines = 0, cursorLine = 0; // cursor is on tail line `cursorLine` (0 = first tail line)
  const inner = Math.max(20, Math.min(cols - 2, 140)) - 4; // text width inside the prompt box (never the full width: a line of exactly `cols` chars leaves xterm in pending-wrap)
  const box = (text = '') => {
    const t = text.slice(0, inner - 2);
    return [`╭${'─'.repeat(inner + 2)}╮`, `│ ${B}>${R} ${t}${' '.repeat(inner - 2 - t.length)} │`, `╰${'─'.repeat(inner + 2)}╯`];
  };
  const api = {
    cols,
    /** Tail for a Claude Code-style session: optional spinner line, the box, the shortcut hint. */
    tail({ spinner = null, typed = '', hint = true, dialog = null } = {}) {
      if (dialog) return { lines: dialog, cursor: { line: dialog.length - 1, col: 1 } };
      if (style === 'codex') {
        const lines = [];
        if (spinner) lines.push(spinner, '');
        lines.push(`${B}›${R} ${typed}`);
        return { lines, cursor: { line: lines.length - 1, col: 3 + typed.length } };
      }
      const lines = [];
      if (spinner) lines.push(spinner, '');
      const b = box(typed);
      lines.push(...b);
      if (hint) lines.push(`  ${D}? for shortcuts${R}`);
      return { lines, cursor: { line: spinner ? 3 : 1, col: 5 + typed.length } };
    },
    /** Escape sequence: replace the old tail with `content` lines followed by the new tail. */
    render(content = [], tail = { lines: [], cursor: { line: 0, col: 1 } }) {
      let s = '\r';
      if (tailLines && cursorLine > 0) s += `${ESC}${cursorLine}A`;
      s += `${ESC}J`;
      const all = [...content, ...tail.lines];
      s += all.join('\r\n');
      const up = tail.lines.length - 1 - tail.cursor.line;
      if (up > 0) s += `${ESC}${up}A`;
      s += `${ESC}${tail.cursor.col}G`;
      tailLines = tail.lines.length;
      cursorLine = tail.cursor.line;
      return s;
    },
  };
  return api;
}

/** Claude Code-style lines of one tool step: "⏺ Tool(input)" and its dim "⎿ result" line. */
export const step = (tool, input, result) => [`${G}⏺${R} ${B}${tool}${R}(${input})`, `  ${D}⎿  ${result}${R}`, ''];
/** A short reply paragraph, wrapped to `width`. */
export const say = (text, width = 60) => [...wrap(text, width).map((l, i) => (i ? `  ${l}` : `${G}⏺${R} ${l}`)), ''];
/** The user's instruction as the CLI echoes it. */
export const prompt = (text, width = 60) => [...wrap(text, width).map((l, i) => `${D}${i ? '  ' : '> '}${l}${R}`), ''];
/** Codex-style: "• Tool input" lines with a dim result, and "› instruction". */
export const cstep = (what, result) => result ? [`${B}•${R} ${what}`, `  ${D}${result}${R}`, ''] : [`${B}•${R} ${what}`, ''];
export const csay = (text, width = 60) => [...wrap(text, width).map((l, i) => (i ? `  ${l}` : `${B}•${R} ${l}`)), ''];
export const cprompt = (text, width = 60) => [...wrap(text, width).map((l, i) => `${D}${i ? '  ' : '› '}${l}${R}`), ''];
export const spinner = (seconds, style = 'claude') => (style === 'codex'
  ? `${D}• Working (${seconds}s · esc to interrupt)${R}`
  : `${Y}✻${R} ${D}Working… (${seconds}s · esc to interrupt)${R}`);

/** Claude Code-style permission dialog, as the CLI draws it in the terminal. */
export const permissionDialog = (command, description) => [
  `${G}⏺${R} ${B}Bash${R}(${command})`,
  '',
  `  ${B}Bash command${R}`,
  `  ${command}`,
  `  ${D}${description}${R}`,
  '',
  `  Do you want to proceed?`,
  `  ${B}❯ 1. Yes${R}`,
  `    2. Yes, and don't ask again for ${command}`,
  `    3. No`,
  '',
  `  ${D}Esc to cancel${R}`,
];

export function wrap(text, width) {
  const out = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > width) { out.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(line);
  return out;
}

/** Index to pass as `from` to waitForInput: everything the transport has seen so far. */
export const inputMark = (f) => f.data.pty.length;
/** Waits (real time) until the transport has recorded a terminal `input` for the session after `from`. */
export async function waitForInput(f, sid, test, { from = 0, timeout = 3000 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const hit = f.data.pty.slice(from).find((e) => e.action === 'input' && e.session_id === sid && test(e.data || ''));
    if (hit) return hit;
    await f.page.waitForTimeout(15);
  }
  throw new Error(`terminal input for ${sid} never reached the transport`);
}

/** Sends text to a session's terminal (the transport's output channel). */
export const out = (f, sid, data) => f.controls.broadcast({ type: 'output', session_id: sid, data });

/** Columns the app asked the PTY for (its last resize for the session), or a default. */
export const colsOf = (f, sid, fallback = 80) => f.data.pty.filter((e) => e.action === 'resize' && e.session_id === sid).at(-1)?.cols || fallback;
