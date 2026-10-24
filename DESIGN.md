---
name: Panel OLA
description: Warehouse goods-reception panel laid out as construction material — a cement-paper frame holding one white work sheet, warm ink, one signal orange, figures in a condensed face.
colors:
  ground: "#e8e4dc"
  ground-deep: "#ddd8ce"
  surface: "#ffffff"
  raised: "#faf9f6"
  border: "#eae7e0"
  rule: "#f1eee7"
  rule-course: "#ddd8ce"
  control: "#d1ccc2"
  text: "#2a2320"
  muted: "#6c645c"
  muted-on-ground: "#57504a"
  accent: "#d95d2b"
  accent-ink: "#a63d16"
  accent-strong: "#c24a1a"
  positive-ink: "#2f4526"
  positive-bg: "#e4ede0"
  warning-ink: "#6b551b"
  warning-bg: "#f5edd5"
  negative-ink: "#832a17"
  negative-bg: "#f7e3dc"
typography:
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  section:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  kpi:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.15
    fontFeature: "tabular-nums"
  figure:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    fontFeature: "tabular-nums"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  small:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  sheet: "16px"
  card: "8px"
  control: "6px"
  chip: "4px"
  pill: "999px"
spacing:
  sheet-inset: "8px"
  pad: "24px"
  gap: "24px"
  row-height: "44px"
components:
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "Archivo 13px/500"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.raised}"
  button-primary:
    backgroundColor: "{colors.accent-strong}"
    textColor: "#ffffff"
    typography: "Archivo 13px/500"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.accent-ink}"
  button-small:
    typography: "Archivo 12px/500"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "28px"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "Archivo 13px/400"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
    width: "320px"
  form-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "Archivo 13px/400"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "38px"
  kpi-cell:
    padding: "14px 18px"
  table-row:
    height: "{spacing.row-height}"
    padding: "10px 12px"
  stamp:
    textColor: "{colors.accent-ink}"
    typography: "Barlow Condensed 13px/600 uppercase 0.12em"
    rounded: "{rounded.chip}"
    padding: "1px 8px 0"
  stamp-no:
    textColor: "{colors.negative-ink}"
    typography: "Barlow Condensed 13px/600 uppercase 0.12em"
    rounded: "{rounded.chip}"
    padding: "1px 8px 0"
  pill-ok:
    backgroundColor: "{colors.positive-bg}"
    textColor: "{colors.positive-ink}"
    typography: "Archivo 11.5px/500"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  pill-pendiente:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-ink}"
    typography: "Archivo 11.5px/500"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  pill-incidencia:
    backgroundColor: "{colors.negative-bg}"
    textColor: "{colors.negative-ink}"
    typography: "Archivo 11.5px/500"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  empty-slot:
    textColor: "{colors.muted}"
    typography: "Archivo 13px/400"
    rounded: "{rounded.card}"
    padding: "14px 16px"
---

# Design System: Panel OLA

## Overview

**Creative North Star: "Materia de obra"**

The panel reads as the material it handles. A cement-paper L-frame (`#E8E4DC`) holds exactly one white work sheet; everything the worker reads sits on that sheet like a delivery note on a desk. The palette is the palette of the warehouse itself: kraft paper, cement grey, warm ink, and one signal orange that behaves like a safety marking — rare, functional, impossible to miss. Dense tables are laid in brick courses (_tongadas_) on a 44px ceramic module pitch, so scanning a queue feels like reading a wall of labeled bays. When a reception is validated, a rubber stamp lands on the row: CONFORME, tilted, slightly out of register — the one authored moment in an otherwise still, operational interface.

This world refuses the neutral card kit where every block floats on grey behind an icon in a tinted square. It is flat by doctrine: depth comes from a single tone step (frame vs. sheet, row vs. hover) and hairline rules, never from shadows. Density is medium-high and deliberate — 44px rows, 24px gutters, tabular figures — because the worker lives in this screen across a full shift and scansability beats expression. The status language is material too: verdicts are stamped, states are tinted chips in olive, amber and rust, and every number is set in a condensed industrial face that reads as measured quantity.

**Key Characteristics:**

- One tinted L-frame, one white work sheet — maximum three nesting levels (frame, sheet, card).
- One chroma only: signal orange on the mark, the single primary action and the main data figure/series.
- Status as material: rubber stamps for verdicts, pale-tint pills for states (olive / amber / rust on their own hue's tint).
- Two faces with one job each: Archivo for prose, Barlow Condensed for every figure, code and ubicación.
- Flat, shadowless depth; brick-course table rules at every dock change; 44px module pitch.

## Colors

Warm, papery and low-chroma: neutrals are cement and kraft, ink is warm brown-black, and exactly one saturated hue punctuates the whole app.

### Primary

- **Signal Orange** (`#D95D2B`): the only chroma in the system. It lives on the mark (the stroke inside the dark square logo), the stamp outline, the "unknown" segment of the shrinkage split bar, and the main data figure of a screen when that figure is the problem to act on (`kpi-value.accent`).
- **Signal Orange Action** (`#C24A1A`): the contrast-safe step of the accent, used as the fill of the one primary action button (5.3:1 with white). The raw accent never fills a button.
- **Signal Orange Ink** (`#A63D16`): the accent as small text and stamp lettering on white (4.8:1) — the accent figure in the KPI strip and the CONFORME stamp text.

### Neutral

- **Cement Paper** (`#E8E4DC`): the app frame — sidebar and top bar share this one ground with no rule between them.
- **Cement Paper Deep** (`#DDD8CE`): one step darker for contained blocks on the frame — the shift card, the active nav item — and for course rules.
- **Work Sheet** (`#FFFFFF`): the single sheet all content lives on.
- **Sheet Lift** (`#FAF9F6`): the barely-there lift under hovered rows, hovered secondary buttons and the reception form fill.
- **Sheet Edge** (`#EAE7E0`): the 1px sheet and card edge. Hairlines, never strokes.
- **Row Rule** (`#F1EEE7`): the ordinary row rule inside tables and lists.
- **Course Rule** (`#DDD8CE`): the heavier rule that opens a new brick course (dock change).
- **Control Border** (`#D1CCC2`): input, button and scrollbar borders — one step darker than card edges so controls read as controls.
- **Warm Ink** (`#2A2320`): all primary text and the logo square.
- **Muted Ink** (`#6C645C`): secondary text on white (5.8:1) — labels, captions, table headers.
- **Muted Ink on Frame** (`#57504A`): secondary text on the cement frame (5.8:1).

### Status pairs

Status is always a pale tint background with a dark ink of the _same hue_ — never a saturated badge.

- **Olive pair** — positive: ink `#2F4526` on tint `#E4EDE0` (`pill-ok`: operational machinery, known shrinkage).
- **Amber pair** — pending: ink `#6B551B` on tint `#F5EDD5` (`pill-pendiente`: "En validación").
- **Rust pair** — negative: ink `#832A17` on tint `#F7E3DC` (`pill-incidencia`: incidents, unknown shrinkage). `#832A17` also sets the NO CONFORME stamp and negative deltas as plain text.

### Named Rules

**The One Chroma Rule.** Signal Orange is the only chroma in the system. It marks the brand, the single primary action and the one data figure that is the problem to act on. Its rarity is the point; a second hue (a blue, a violet, a green action) breaks the world.

**The Contrast-Safe Step Rule.** The accent steps down before it touches type or fills: `#C24A1A` under white button text (5.3:1), `#A63D16` for small text on white (4.8:1). The raw `#D95D2B` appears only as 2px borders, the mark stroke and data bars — never as text.

**The Same-Hue Status Rule.** Status = pale tint + dark ink of one hue (olive, amber, rust). Never a saturated chip, never a colored dot alone, never hue-as-decoration.

## Typography

**Display/Text Font:** Archivo (self-hosted via `@fontsource`, weights 400 / 500 / 600), fallback `system-ui, sans-serif`.
**Figure Font:** Barlow Condensed (`@fontsource`, weights 500 / 600), fallback Archivo — every number, code and ubicación.

**Character:** A workaday grotesque for prose paired with a condensed industrial face for figures. The condensed figures have their own drawing and align in columns, so quantities read as measured material, not as text.

### Hierarchy

- **Title** (600, 24px / 1.15, `-0.02em`): the screen's one h1 ("Recepción de mercancía"). Drops to 20px under 640px.
- **Section** (600, 16px, `-0.01em`): panel and rail headings (h2 / h3).
- **KPI value** (Barlow Condensed 600, 26px / 1.15, tabular): the four strip figures. Units sit beside them at Barlow Condensed 500, 15px, muted.
- **Figure** (Barlow Condensed 600, 15px, tabular): table numbers, albarán codes (`code`, 15px, `+0.02em`), split-bar figures (21px), material and incident values.
- **Body** (400, 14px / 1.45): KPI labels and general copy.
- **Small / label** (400–500, 12px; UI chrome at 13px / 13.5px / 11.5px): table headers (12px, 400, muted, sentence case, no fill), captions, nav items (13.5px / 500), buttons (13px / 500), pills (11.5px / 500).
- **Stamp** (Barlow Condensed 600, 13px, uppercase, `0.12em`): the only letterspaced uppercase in the system.

### Named Rules

**The Figure Face Rule.** Every figure, code and ubicación is Barlow Condensed with `font-variant-numeric: tabular-nums` (the `.num` utility). Archivo never sets a number in a data context; Barlow Condensed never sets a sentence.

**The Quiet Header Rule.** Table headers are 12px regular muted with no fill and no rule — the data, not the chrome, carries the emphasis.

## Layout

The shell is one L-frame and one sheet. The sidebar (`216px`) and top bar (`48px`) share the cement ground with **no rule between them**; the white sheet fills the rest, inset `8px` from the window's right and bottom edges (`--sheet-inset`), with `0 16px 16px 16px` corners so its top-left butts the L. Sheet padding is `24px` (`--pad`), and every major block (title row → KPI strip → work grid) is separated by the same `24px` (`--gap`).

Inside the sheet: a title row (h1 + one grey sub-line left, actions right, bottom-aligned), then the KPI strip as **one container split by hairlines** (4 equal cells, 1px `--rule` dividers, no gaps), then the work grid — `minmax(0, 1fr)` for the main block beside a fixed `286px` (`--rail-width`) right rail, `24px` apart. The rail stacks `rail-block`s (16px heading _outside_ its card, 8px above, 24px between blocks).

The spacing rhythm is a 44px ceramic module: table rows sit on `--row-height: 44px`, and denser UI (buttons 36px, tabs 28px, inputs 38px, search 32px) stays inside that pitch. Radius encodes nesting rank: sheet 16px → card 8px → control 6px → chip 4px (see Shapes).

### Named Rules

**The Course Rule.** Long tables are laid like brick courses: 44px rows, a hairline `--rule` between rows of one course, and the heavier `--rule-course` where a new course starts (dock change). The courses are the table's structure — don't zebra-stripe over them.

### Responsive rules

- **1100px — the frame folds.** The app stacks; the sidebar becomes a 48px top row (brand + a "Menú" button, `border-bottom: 1px solid --rule-course`), its nav, scope line and shift card moving into a fixed `menu-sheet` (`inset: 48px 0 0`, cement ground). The top bar hides; the sheet goes flush (no border, no radius, no margin). The work grid collapses to one column, the KPI strip becomes 2×2 (hairlines re-cut: no left border on odd cells, a top rule on cells 3–4), the form grid halves to 2 columns, and title actions take a full row.
- **768px — the queue becomes two-line items.** The albaranes table (`.queue`) drops its header and re-lays each row as a grid: line 1 is code · identity · status · action, line 2 is transportista · líneas · ubicación, `6px 10px` gaps, `12px 0` padding, course rules preserved on the row itself. Units reappear inline (`cell-unit`, 12px Archivo, muted) since columns are gone; pills shrink to 11px / `2px 7px`; hover moves to the whole row.
- **640px — compression.** The form grid goes single column, the title drops to 20px, panel heads wrap and tabs scroll inside their own row.

## Elevation & Depth

Flat, by doctrine. **There is not a single `box-shadow` in the system.** Depth is carried by exactly two devices: one tone step (cement `#E8E4DC` frame against white sheet; `#FAF9F6` lift on hover; `#DDD8CE` for blocks seated on the frame) and hairline borders (`#EAE7E0` edges, `#F1EEE7` row rules, `#DDD8CE` course rules, `#D1CCC2` control borders). Focus is a flat 2px orange outline, not a glow.

### Named Rules

**The Flat Frame Rule.** Surfaces are flat at rest and flat in response. Hover is a tone step (`--raised`), focus is a 2px outline, elevation is nesting. Never a shadow, glow, blur or gradient — including under the sheet.

## Shapes

Corner radius encodes structural rank, one step per nesting level: sheet `16px` (top-left square), card `8px`, control `6px`, chip `4px`, pills fully round (`999px`). Borders are 1px hairlines in the border family except two deliberate heavy marks: the stamp's `2px` outline and the focus ring's `2px` outline. The empty state is a `1px dashed` slot (`--control`) with 8px corners — the only dashed line in the system. Wide content wraps in an overflow frame (`.table-frame`) rather than distorting the geometry.

### Named Rules

**The Radius Encodes Rank Rule.** Radius follows nesting depth: 16 sheet, 8 card, 6 control, 4 chip. A card may not wear the sheet's radius, and no fourth nesting level exists to need a fifth step.

## Components

### Shell — frame and sheet

The frame is the L (sidebar `216px` + top bar `48px`, one cement ground, no divider). The sheet is the only content surface: white, `1px` `#EAE7E0` edge, `24px` padding, `8px` inset right/bottom, own scroll. Under 1100px the sheet becomes the screen (see Layout).

### Navigation and shift card

Sidebar links are plain 13.5px / 500 text blocks, `8px 10px`, 6px radius: hover steps the ground to `#DED9CF`, the active item seats on `--ground-deep` at 600. No icons, no underline, no accent — the mark is the only brand in the rail. The shift card is a `--ground-deep` block (8px radius, `12px 14px`) with a 13px name and 12px shift line in muted-on-ground.

### Title row and buttons

Title left (24px / 600), one 13px muted sub-line, actions right, bottom-aligned. Buttons are 36px tall, 6px radius, 13px / 500. **Secondary:** white fill, `--control` border, hover lifts to `--raised`. **Primary:** `#C24A1A` fill with white text, hover darkens to `#A63D16`; exactly one per screen, always the screen's main task ("Registrar recepción"). **Small:** 28px, 12px — inline row actions ("Validar"). Ghost links and icon buttons do not exist in this world.

### KPI strip

One container (1px `--border`, 8px radius) split by 1px `--rule` hairlines into 4 equal cells (`14px 18px` each): 14px muted label, 26px Barlow Condensed figure at 600, 12px muted note naming the baseline. The screen's main data figure turns `--accent-ink` (e.g. shrinkage while unknown loss exists). A two-cell variant exists for narrower strips.

### Tables — the brick courses

Header: 12px regular muted, sentence case, no fill, no rule. Rows: 44px pitch, `10px 12px` cells, `1px --rule` top rules — except the first row of every **course**, which gets `1px --rule-course` (`tr.course-start`, applied where the dock changes). Numbers right-align in Barlow Condensed tabular; identity columns truncate with ellipsis (`max-width: 190px`); codes and ubicaciones (03-A-12 style) use the figure face at `+0.02em`. Hover lifts the row to `--raised`. A muted 12px footer line states the visible total ("7 de 7 albaranes · Muelles 1–7"). Columns empty in every row are dropped, never drawn as dead bands.

### Status — stamps and pills

The **stamp** is this world's signature mark: Barlow Condensed 600, 13px uppercase `0.12em`, `2px` outline, 4px radius, `1px 8px 0` padding, rotated off-axis like a real rubber stamp. CONFORME: orange outline/text (`--accent` / `--accent-ink`) at `-2deg`. NO CONFORME: rust (`#832A17` both) at `+2deg`. It is reserved for conformity verdicts on albarán rows. **Pills** carry ordinary states: fully round, 11.5px / 500, `3px 9px`, always a same-hue tint/ink pair (see Colors). One status mark per row.

### Rail blocks

A 16px / 600 heading sits _outside_ its card; the card below is 1px `--border`, 8px radius, `16px` padding. Patterns: the **split bar** (10px tall, fully round, `--accent` unknown against warm grey `#8C8378` known, with 21px figures beneath — the unknown figure takes `--accent-ink`); the **material rows** (13px name + 15px figure, a 2px proportional bar under each, top material's bar in `--text`); the **incident rows** (description + code left, negative delta in rust right).

### Forms

The reception form is a `--raised` card (1px `--border`, 8px radius, `16px` padding) with a 4-column grid (`12px 16px` gaps): labels 13px / 500 above fields, fields 38px tall, white, `--control` border, 6px radius, `0 10px` padding. Submit is the primary button. No floating labels, no fieldsets, no icons.

### States

- **Hover:** tone step only — rows and secondary buttons to `--raised`, nav to `#DED9CF`, tabs to `--text`, primary to `--accent-ink`. Instant: the system defines no transitions except the stamp.
- **Focus:** global `:focus-visible` — `2px solid --accent`, `2px` offset, 2px radius. One treatment for every control.
- **Loading and empty:** the same dashed slot (`.empty-slot`: `1px dashed --control`, 8px radius, `14px 16px`, 13px muted text) with contextual copy — "Cargando el turno…" for loading, "No queda ningún albarán pendiente en este turno." / "Sin mermas registradas este mes." for empty. Never a spinner, skeleton or illustration.
- **Error:** the world has no error banner or red toast; failure and mismatch speak in the status language — the NO CONFORME stamp, the rust pill, and negative deltas in `#832A17`.

### Motion — the one authored moment

Motion exists exactly once: **the stamp landing**. When a reception is validated, its CONFORME stamp scales in (`stamp-landing`, 260ms, `cubic-bezier(0.2, 0.9, 0.25, 1)`): from `rotate(-2deg) scale(1.35)` at opacity 0 to `rotate(-2deg) scale(1)` at opacity 1 — the gesture of a rubber stamp hitting paper. It fires only on the freshly validated row and resets when the tab changes. Under `prefers-reduced-motion: reduce` it does not animate at all. Everything else in the app is still.

### Named Rules

**The One Primary Rule.** Exactly one accent-filled action per screen, right-aligned in the title row, naming the screen's main task. A second `#C24A1A` button means one of them is wrong.

**The Stamp Rule.** The rubber stamp is reserved for conformity verdicts and is the only element allowed to rotate, letter-space, or animate. Its `-2deg` / `+2deg` tilt and its landing are the world's signature — spending them elsewhere spends the signature.

**The Dashed Slot Rule.** Loading and empty share one dashed slot with words in it. No spinners, no skeletons, no empty-state illustrations.

## Do's and Don'ts

### Do:

- **Do** keep the accent as the only chroma: mark, one primary action, main data figure/series (`#D95D2B` and its `#C24A1A` / `#A63D16` steps).
- **Do** set every number, code and ubicación in Barlow Condensed with tabular figures, right-aligned in tables.
- **Do** lay long tables in brick courses: `--row-height: 44px` rows, `--rule` within a course, `--rule-course` at each dock change.
- **Do** express status as stamp (verdict) or same-hue tint pill (state): olive `#2F4526`/`#E4EDE0`, amber `#6B551B`/`#F5EDD5`, rust `#832A17`/`#F7E3DC`.
- **Do** convey depth with tone steps and hairlines (`--raised` hover, `--ground-deep` seated blocks, `#EAE7E0` edges).
- **Do** hold the gutter discipline: `24px` padding and gaps everywhere on the sheet; the KPI strip's cells split by hairlines, not gaps.
- **Do** honor `prefers-reduced-motion` on the stamp.

### Don't:

- **Don't** add a second hue — no blue links, no green confirmations, no violet charts. Color is orange or it is ink.
- **Don't** use shadows, glows, blurs or gradients anywhere, including under the sheet.
- **Don't** put a border between the sidebar and the top bar; the L is one continuous ground (the folded state's bottom rule at 1100px is the one exception).
- **Don't** nest a fourth level beyond frame → sheet → card, and don't let a card wear the sheet's 16px radius.
- **Don't** rotate, stamp or animate anything that is not a conformity verdict.
- **Don't** fill table headers, add zebra striping, or drop the course rules — the brick courses are the table's structure.
- **Don't** use icon glyphs in tinted squares as decoration; navigation and status are words (the logo mark is the only glyph in the system).
- **Don't** set figures in Archivo or prose in Barlow Condensed.
- **Don't** render empty or loading states as spinners, skeletons or illustrations — use the dashed slot with words.
- **Don't** give a screen two primary actions or different gutters for adjacent rows (24px everywhere).
