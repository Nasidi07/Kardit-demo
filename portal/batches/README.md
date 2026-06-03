# Kardit Mini CMS — UJR006 Batch Onboarding

Static prototype of the seven screens for **UJR006 — Batch Customer Onboarding**.
Themed against the **ChamsSwitch Design System** and aligned with the
**Affiliate Portal** app shell pattern (top app bar + left flow rail +
centered container) so the screens drop into the existing application
visually and structurally.

## Files

```
kardit-ujr006/
├── index.html               Redirects to the dashboard
├── 01-dashboard.html        Step 1 — Browse batches (Maker)
├── 02-upload.html           Step 2 — Upload batch file (Maker)
├── 03-validation.html       Step 3 — Validation summary (Maker)
├── 04-submit.html           Step 4 — Submit for approval (Maker)
├── 05-approval.html         Step 5 — Approval queue (Checker)
├── 06-processing.html       Step 6 — Processing monitor (Maker)
├── 07-result.html           Step 7 — Result summary (Maker)
├── cs-tokens.css            ChamsSwitch design tokens (unchanged from system)
├── styles.css               Component styles + app shell mapped onto cs-* tokens
├── app.js                   AppBar + flow-rail renderers, per-screen interactions
├── chamsswitch-logo.png     Brand asset (carried from design system)
└── swoosh.svg               Brand asset (carried from design system)
```

## App shell

Each screen renders into a 3-part shell that mirrors the affiliate
onboarding flow in the design system:

```
┌───────────────────────────────────────────────────────────┐
│ Kardit | Affiliate Portal › Batch Issuance › Step    Help · AO │  scr-app-bar
├──────────────┬────────────────────────────────────────────┤
│ Browse       │                                            │
│ Upload   ←   │                                            │
│ Validate     │           page content goes here           │  scr-rail (left)
│ Submit       │              .container                    │   +
│ Approval     │                                            │  scr-main (right)
│ Processing   │                                            │
│ Results      │                                            │
│              │                                            │
│ Need help?   │                                            │
└──────────────┴────────────────────────────────────────────┘
```

- `scr-app-bar` — Kardit wordmark + breadcrumb + Help link + user info.
  Identical structure to the existing affiliate flow's AppBar.
- `scr-rail` — vertical flow stepper. Step you're on is highlighted in
  green, prior steps show a check, future steps show their number.
  Each step links directly to its page so you can jump around.
  "Need help?" callout sits at the bottom, matching the existing pattern.
- `scr-main / .container` — centered content area, max-width 1100px for
  data-heavy pages and 720px (`.container--narrow`) for forms.

There is **no persistent left nav** and **no right rail** — those would
be provided by the parent application shell that wraps this feature.

## Running it

Open `index.html` in a browser, or serve the folder over HTTP:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Editing the brand / theme

- All design tokens live in `cs-tokens.css` (untouched from the design
  system). Change them there and the whole prototype follows.
- The local CSS variables in `styles.css :root` map prototype-level
  names onto `cs-*` tokens. If you want to swap the green to a different
  brand color, change `--accent` here.
- The brand wordmark is rendered inline in `app.js` via the `.logo-mark`
  span — replace with an `<img>` of the actual Kardit logo when available.

## What's still TODO

- Empty / loading / error states for each screen
- Mobile responsive layout below 960px (the rail collapses but main
  content needs more attention)
- Real Kardit logo asset (currently using the dotted-i wordmark
  pattern from the ChamsSwitch DS)
- Wire to actual API endpoints (currently all data is hard-coded)
- "Rejected by checker" path (forks from SCR-BATCH-05)
- The "Help" link in the AppBar doesn't go anywhere yet
