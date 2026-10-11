# IVE.DEV — Design System (WP2)

Internal reference. Every page and section must comply with this document.
Product truth comes from `_reference-old-site-copy.txt` and the Product truth
block in `README.md`. No capability may be shown that is absent from those.

---

## Brand idea

**Run agents. Keep control.**

IVE is the local control room for parallel coding work. The website presents a
clear outcome, not a collection of implementation details: one goal becomes
visible parallel work and returns as one result a person can review.

The footer is strictly factual: IVE, its relationship to AIFOREU, relevant
links, its EU-based origin, and the beta waitlist. Decorative system-status
language and compressed technical metadata do not appear there.

The header carries a compact “IVE / by AIFOREU” maker lockup. Header ink is explicitly bound to its own surface tokens so the logo and theme control stay readable over the dark opening. The 28px mark, 14px theme label, and 18px outlined “Join the beta” action provide clear hierarchy without a bright filled button; the action remains visible on mobile. The footer keeps
the product relationship “from AIFOREU,” with AIFOREU linked to
`https://aiforgov.eu/`. “EU-backed” is not used because it can imply institutional
EU funding or endorsement; no such claim is part of the verified product truth.

No character, avatar, robot, employee, personality, or workforce metaphor is
used. Commander is a product control, not a persona.

## Visual thesis

**A controlled run, live in Mission Control.**

The five product phases remain the internal structural grammar:

`REQUEST → ROUTE → EXECUTE → VERIFY → PROOF`

The public homepage translates that system into immediate language:

`GOAL → PLAN → WORK → CHECK → REVIEW`

Section eyebrows name the reader’s question or benefit — “Why IVE,” “How it
works,” “Your decision” — instead of exposing internal phase terminology.

The hero’s right column is a live Mission Control composition with a Commander,
four parallel sessions, real terminal output, supported model labels, the
status glyph vocabulary, and a visible verification gate. This is the primary
product expression; it is HTML, not an image. Its caption identifies it as a
product-derived interaction concept rather than a recording.

The signature moment is the living Mission Control instrument: a restrained
pointer tilt, one passing specular glint, moving session progress, and a
four-step “Run at a glance” rail. The motion exposes state and direction; it is
never a decorative particle field.

The end-to-end run retains the scroll-driven branch / execute / verify / merge
story. Its no-JavaScript and reduced-motion form is the fully expanded final
state.

---

## Typography

| Role | Face | Notes |
|---|---|---|
| Display | **Archivo** (500–800, width 100–125%) | H1, H2, concise product headlines, and wordmark. Expanded width gives the control-room voice a recognizable silhouette. |
| Body | **Source Sans 3** (400–600) | All explanatory and marketing copy. 16–18px, generous leading, ~64ch maximum. |
| Machine | **IBM Plex Mono** (400/500/600) | Terminals, session IDs, statuses, metadata, eyebrows, keyboard keys, install commands, ledgers. |

All three families are self-hosted from `assets/fonts/`; production pages make no
request to Google Fonts or another font CDN.

Rules:

- Archivo carries the display voice at 125% width for H1/H2 and 112.5% for
  smaller display roles; its expanded construction is the typographic signature.
- Source Sans 3 keeps explanatory copy calm and readable beside the wider display face.
- Machine voice is IBM Plex Mono. Terminal output is never proportional.
- The H1 leads the product copy. The standalone “WHY IVE?” question deliberately
  fills the viewport before the answers; other chapters step down from the H1.
- The size ladder is hero 42–66px, chapter 32–46px, Why IVE statements 30–54px,
  use-case and section titles 22–30px, card titles 17–19px, and body 16–18px.
- Headlines use weight 620, negative tracking from -0.045em at the largest size
  toward -0.02em at the smallest, balanced wrapping, expanded width, and 1.01–1.15 leading.
- Section eyebrows use IBM Plex Mono at 11px/500, 0.13em tracking, and uppercase
  text; they encode run state.

## Color

The page follows a 60 / 30 / 10 allocation. Roughly 60% is the cool light work
surface, 30% is neutral anthracite across bounded control and verification
fields, and 10% is functional accent. One electric blue means active execution
and routing; it is also the mark’s signal dot. Dark mode reverses the grounds
while preserving those roles. (Amber was the accent until 2026-09-08 and was
retired because it read as a warning and dated the anthracite.)

```text
LIGHT
--bg          #F4F5F6
--bg-raised   #FFFFFF
--bg-inset    #EBEDEF
--bg-glass    rgba(244, 245, 246, 0.82)
--line        #DDE0E3
--line-strong #BFC4C9
--text        #15171A
--text-dim    #4A4F55
--text-faint  #6B7178
```

Semantic colors split marks from readable ink:

```text
--running       #1647FF   --running-ink   #0E36C7
--complete      #087A4B   --complete-ink  #066B41
--waiting       #98A0A8   --waiting-ink   #5A6067
--attention     #C83B24   --attention-ink #A82F1B
--route         #1647FF   --route-ink     #0E36C7
--focus         #1647FF
```

```text
DARK
--bg #101012 · --bg-raised #17171A · --bg-inset #0B0B0D
--bg-glass rgba(16, 16, 18, 0.82)
--line #26262B · --line-strong #34343B
--text #EDEDE9 · --text-dim #A3A39E · --text-faint #85857F
--running / --running-ink #5B8CFF
--complete / --complete-ink #7DCE82
--waiting / --waiting-ink #8A8A93
--attention / --attention-ink #F2545B
--route / --route-ink #5B8CFF · --focus #5B8CFF
```

Mission Control, the architecture security ledger, and the footer use the
secondary ground. Human review remains the explicit opposite-ground moment.

The high-intent hero CTA and the waitlist submit action use the execution accent:

```css
.hero .btn-primary { background: var(--running); color: var(--on-accent); }
.exit .exit-cta { background: #1647FF; color: #FFFFFF; } /* fixed: it sits on the black room in both themes */
```

Rules:

- Blue is earned by live/running marks, the two run actions, routes,
  architecture paths, and routing links. Nothing else is blue.
- No broad multicolor gradients, neon glow, purple, or decorative saturation.
  The hero may use a low-opacity grid, a contained blue signal field, and one
  white/blue specular glint to make Mission Control feel physically present.
- The focus ring remains visible on every interactive control.

## Status language

```text
○ queued   ◐ thinking   ● running   ◇ waiting   ✓ complete   ! attention
```

Use IBM Plex Mono. Pair a symbol with a word at first use. The symbol must still
communicate without color.

## Layout

- Twelve-column fluid grid, 1480px maximum content width, 8px base spacing.
- Strongly left aligned and deliberately asymmetric.
- Section eyebrows carry plain-language orientation and reserve no viewport
  edge or content column.
- Raw page plus hairline rules is the default surface.
- Panels are reserved for product UI: terminals, session tiles, board columns,
  run ledgers, and generated briefings.
- Marketing copy never sits in a card.
- Section rhythm stays uneven: thesis → human problem → visible run → four
  outcomes → inverted human review → local trust → concrete examples → simple
  final action.

## Information architecture

The homepage contains exactly these blocks, in order:

1. Header
2. Hero: the controlled run
3. Why IVE: four short benefits, one at a time — parallel work, every agent
   in view, automatic retries, and the reader's final decision
4. How it works
5. Four user outcomes
6. Merge: every session comes back as one review, drawn by scroll
7. Human review and decision
8. Beta invitation and local workflow
9. Three concrete use cases in an interactive run chooser
10. Beta waitlist: a static, immediately usable signup section. The established
    Archivo / Source Sans 3 / IBM Plex Mono faces and cool gray / electric blue
    tokens carry through. A two-column composition pairs the invitation with a
    simple form; on mobile it stacks. Email is required, name is optional. A clear
    consent checkbox links to the privacy notice. Submission has loading, retry,
    and confirmation states; no fake success before the server saves the entry.

Architecture, implementation totals, and the deeper security surface belong on
the dedicated Architecture page or in the repository documentation.

## Radius and surface

- Product panels and terminals: 8px.
- Small chips and keys: 4px. Buttons: 6px.
- Nothing pill-shaped.
- Terminals use `--bg-inset`, a 1px line, and 13px mono output.
- No fake macOS chrome.

## Motion

Grammar: **Branch → Execute → Verify → Proof.**

- The end-to-end run uses CSS transforms with vanilla JavaScript.
- “WHY IVE?” first owns the entire viewport. “You have the agents.” sets up
  the question, which holds on its own with a quiet scroll cue. The same two
  words then shrink and move into a prominent chapter heading; only once that
  movement is nearly complete do the four short answers and their visual appear.
  On mobile the opening question stacks on two lines, then comes together into
  one line above the answers. The first 28% of the scroll belongs to this setup.
  The question animates through real font sizes and positioned words. Never
  enlarge a small text layer with `scale()` or `will-change: transform`: Safari
  can retain the small raster and visibly pixelate the full-screen lettering.
  Each answer has one explanatory sentence. One continuous composition of four session
  sheets unfolds in perspective for parallel work, turns face-on into an
  overview, passes beneath a verification scan that changes retry to complete,
  and stacks beneath a final review. The reader controls the pace in either
  direction. Text fades out before the next statement appears, with a small
  depth and focus shift. Four labeled progress controls jump to each settled
  state and work with the keyboard. The visual is labeled as an illustrated
  example, and its review surface is an illustration, not a live merge action.
  The sequence has no continuous animation loop: only scroll and resize request
  frames. Small screens scale the instrument beneath the text. Reduced motion,
  no JavaScript, and short landscape windows show all four benefits in normal
  flow. All four explanations remain available to assistive technology.
- The page opens inside the machine: black ground, a grid corridor (floor,
  ceiling, walls in true perspective) rushing past with ring frames, a slow
  camera drift, and coding agents as two-line session cards swarming around
  the viewer in depth, running, retrying, waiting, with a live count under
  the caption. The swarm moves on its own; scrolling drives the story. Under
  “Under control.” the cards glide onto one Mission Control board and settle
  to complete. Then everything goes dark, and the viewer zooms out of the
  letters themselves: the view starts inside the V’s left stroke, the stroke
  edges recede, the light page appears around the black shapes, I and E
  come in from the sides, until the mark “IVE” stands, filling the viewport. The header sits on the black
  ground in light ink until then. Scrolling on pulls the three letters apart
  while “ntegrated”, “ibecoding” and “nvironment” slide out from behind them
  until the full name stands. The type size always follows the room the line
  needs, so the name never leaves the viewport. Below 720px the letters stack
  and unfold to the right. A “Scroll” cue with a running line sits below at
  the start. Once the name stands, the maker's signature “made by AIFOREU ↗”
  appears at the foot of the pin and links to AIFOREU; in the header,
  “by AIFOREU” under the wordmark is that same link. Without JavaScript or
  with reduced motion the full name stands as a plain block with the
  signature below. The cards are product objects, not characters.
- The hero enters as one orchestrated sequence once it scrolls into view;
  Mission Control may respond by no more than 2.2 degrees to a fine pointer.
- “Run at a glance” advances with the example state and always remains readable
  without motion.
- Near the end, the run chooser lets the reader switch between three truthful
  use cases. Its four task rows advance only while the instrument is visible;
  the run remains an illustrated example.
- Merge, between the parallel work and its review: one lane per session
  starts across the full width and curves into a single trunk. Scroll draws
  the lanes in a stagger, a dot rides each drawing edge, a small packet
  travels every running lane, and a lane and its label turn complete as it
  arrives. The trunk then draws down out of the section in the complete
  green, ending in one review. Faint ghost lines show the paths before they
  are drawn. Below 720px there are six lanes and id-only labels.
- The page closes with the static beta signup. It never waits for an animation
  or scroll transition before revealing the form. Header and hero CTAs link
  directly to `#waitlist`. Respect reduced motion and support native HTML POST
  submission when JavaScript is disabled.
- Ambient changes are sparse and product-relevant.
- `prefers-reduced-motion` removes ambient and scroll animation, expands the run
  to its final state, and leaves the chooser in its completed review state.
- With JavaScript disabled all content and the final run state remain readable.

## Voice

- Clear, confident, and human. Short declarative sentences.
- State the user-visible action or result directly: one goal, separate tasks,
  visible checks, and one result to review.
- Use words a product user recognizes: goal, task, work, check, result, review.
  Keep route, PTY, MCP, worktree, event bus, and implementation details off the
  first explanatory layer.
- Benefit first, mechanism second. Put deep implementation detail on the
  Architecture page.
- Describe controls and review states, not personalities.
- Compatibility copy says what is supported today. Anything else is explicitly
  labeled roadmap.
- No corporate filler, meme voice, grandiosity, or workforce metaphor.
- No decorative system messages, fake operational states, or internal phase
  labels in public copy. Status glyphs belong only to product states inside
  diagrams and demonstrations.
- Avoid compressed slogans when one factual sentence can explain the same
  thing. Buttons name the page or action they actually open.

## Honesty constraints

The owner approved a publicly shareable macOS installer on 2026-10-11. The
dedicated `/download/` page is an exception to the older invitation-only,
no-version and CLI lists below: it uses verified IVE 1.0.1 release facts
(Apple Silicon, macOS 13.5+, Claude Code/Codex, signed/notarized app).
The homepage keeps its waitlist flow. Do not infer an open-source app release.

- Access is by beta invitation. Do not promise open-source availability, a public repository, a license, or a direct installation.
- If product telemetry is discussed, explain it in plain prose next to the
  relevant technical documentation rather than compressing it into metadata.
- Supported CLIs: Claude Code and Gemini CLI only.
- Supported models: Haiku, Sonnet, Opus, Gemini Pro, and Flash only.
- Allowed totals: 140+ API routes, 40+ shortcuts, 35+ MCP tools, 30+ event
  types, 20 RALPH iterations maximum, 8,000+ skills, 6 board columns, 9 package
  scan steps, 3 access modes, and 4 memory types.
- When numeric product totals are shown, they sit beside the visible source
  line: “Development snapshot · capabilities may change during the beta.”.
- No customer claims, social proof, release dates, version numbers, OS matrix,
  unverified metrics, or unsupported integrations.

## Anti-patterns (hard bans)

- Purple/violet, neon cyan+magenta, diffuse neon glows, star fields, orbs, or
  sparkle icons. A contained surface glint is allowed only in the hero.
- Matrix green, hacker cosplay, ASCII art as decoration.
- Cards for everything; icon-grid feature walls; decorative bento layouts.
- Generic node graphs, neural imagery, robot/AI-head illustrations.
- Character, avatar, robot, employee, personality, or workforce metaphors.
- Fake macOS chrome, fake customers, fake numbers, fake code.
- Custom cursors, WebGL, animation libraries, autoplay video.
- Warm-cream + serif + terracotta; black + acid-green; broadsheet templates.
- Looking like Cursor, Linear, Zed, Raycast, or Warp.
- Retired brand line: “One brain. Infinite&#32;hands.”
- Retired collaboration wording: “agent&#32;army” / “agent&#32;armies”.
- Retired session line: “tmux wish&#101;s it could do this.”
