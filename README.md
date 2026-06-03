# Kardit — Merged Site + UJR006

The original Kardit / ChamsSwitch site (marketing pages, sign-in, affiliate
onboarding flow) bundled with the UJR006 Batch Issuance prototype, so the
end-to-end click-through works without any backend.

## Folder structure

```
kardit-merged/
├── index.html                          ChamsSwitch home (entry)
├── kardit-website*.html                Kardit-specific marketing pages
├── chamsswitch-website.html
├── about.html / solutions.html / partners.html / industries.html / contact.html
├── signin.html                         Sign-in (modified — see below)
├── colors_and_type.css                 Brand tokens (root copy)
├── assets/                             Original site assets (logo, swoosh, site.css/js)
├── flows/
│   └── affiliate_onboarding/           Affiliate onboarding wizard (other team)
└── portal/
    ├── batches/                        UJR006 — Batch Customer & Card Issuance
    │   ├── 01-dashboard.html through 07-result.html
    │   ├── 00-welcome.html             Optional journey landing
    │   ├── app.js, styles.css, cs-tokens.css
    │   └── README.md                   UJR006-specific docs
    └── customers/                      UJR005 + UJR007 — Customers module
        ├── index.html                   UJR007 — Customer search (SCR-VCUS-01)
        ├── profile.html                 UJR007 — Customer profile (SCR-VCUS-02)
        ├── 01-form.html                 UJR005 — New customer form
        ├── 02-saved.html                UJR005 — Draft-saved confirmation
        └── app.js, styles.css, cs-tokens.css
    └── issue-card/                      UJR008 — Unified Customer + Card Issuance
        ├── 01-start.html                SCR-ISS-01 Start / warm-start detection
        ├── 02-customer.html             SCR-ISS-02 Customer information capture
        ├── 03-card.html                 SCR-ISS-03 Bank + product + type selection
        ├── 04-delivery.html             SCR-ISS-04 Physical delivery (conditional)
        ├── 05-review.html               SCR-ISS-05 Review + confirm + idempotency
        ├── 06-result.html               SCR-ISS-06 Result (Virtual ACTIVE / Physical PERSONALIZING)
        └── app.js, styles.css, cs-tokens.css
    └── card/                            UJR009 + UJR010 + UJR015 — Card Servicing
        ├── index.html                   UJR015 — Card detail + balance (FR-BAL-API-01)
        ├── freeze.html                  UJR009 — Freeze confirmation
        ├── unfreeze.html                UJR010 — Unfreeze confirmation
        └── app.js, styles.css, cs-tokens.css
    └── load-funds/                       UJR012 — Load funds (maker-checker)
        ├── 01-form.html                 Pick card + amount + source + reference
        ├── 02-review.html               Maker review + idempotency
        ├── 03-result.html               Result + audit trail
        └── app.js, styles.css, cs-tokens.css
    └── reports/                          UJR020 — Reports (generate + download)
        ├── index.html                   6 report cards, range filter, CSV/PDF generation
        └── app.js, styles.css, cs-tokens.css
    └── bank/                             UJR023 — Bank portfolio (different actor)
        ├── index.html                   Zenith Bank scope · affiliates table · KPIs
        └── styles.css, cs-tokens.css
```

## How the click-through works

Open `index.html` in any browser and follow the natural flow:

1. **Marketing site** (`index.html`, `kardit-website.html`, etc.) — public.
2. **Sign in** (`signin.html`) — fill any email + 8+ char password, submit.
3. → **Operational dashboard** (`portal/index.html`) — the post-login
   landing page (UJR019 stub per SCR-DSH-01). Persistent left side menu
   on every portal screen exposes the available journeys.
4. From the dashboard side menu or quick-action cards:
   - **Customers** → UJR007 Customer search list (`portal/customers/index.html`)
     - Click any row → UJR007 Customer profile (`portal/customers/profile.html?ref=...`)
     - Click "+ New customer" → UJR005 capture form (`portal/customers/01-form.html`)
   - **Cards** → UJR008 Issue card (`portal/issue-card/01-start.html`) — cold-start flow
     - From UJR005 saved or UJR007 profile → warm-start (`?customerId=...` skips capture)
     - From UJR007 profile card row → UJR015 detail / UJR009 freeze / UJR010 unfreeze
   - **Batches** → UJR006 Batch Customer & Card Issuance (`portal/batches/01-dashboard.html`)
   - **Funds** → UJR012 Load funds (`portal/load-funds/01-form.html`) — maker-checker
   - **Reports** → UJR020 Generate reports (`portal/reports/index.html`)
   - Dashboard also has a **"View as Issuing Bank"** demo tile → UJR023 (`portal/bank/index.html`) — switch personas to see the bank-scoped portfolio
5. **Sign out** from any portal screen (top-right user widget) → back to `signin.html`.

The side menu, Kardit logo, and breadcrumb "Dashboard" link all return to
`portal/index.html` from inside any UJR.

### SRS alignment

The post-login routing follows **SCR-AUTH-02 step 3** ("Redirect to dashboard")
and **SCR-DSH-01** (Dashboard KPIs) which the SRS defines as the operational
home for Affiliate, Bank, and Service Provider users. KPI tiles are
placeholders until UJR019's real metric service is wired up.

## Files that were modified for the integration

Two minimal changes to the original site to wire UJR006 in. Both are
well-commented and easy to revert or replace:

1. **`signin.html`** — the simulated success state used to just show
   "Welcome back ✓" and stop. It now redirects to
   `portal/batches/01-dashboard.html` after the success animation.
   The real auth handler (whichever team owns it) should replace this
   redirect with whatever role-based routing they implement.

2. **`portal/batches/app.js`** — the `renderAppBar` function now wraps
   the Kardit wordmark in a link to `../../index.html`, points Help at
   `../../contact.html`, and adds a "Sign out" link to `../../signin.html`
   in the user widget.

Nothing else in the original site was touched.

## What's *not* here (other teams' work)

- The **operational portal home** — the page that sits between sign-in
  and UJR006, showing the side menu with Dashboard / Customers / Cards /
  Batches / Funds / Reports etc. (see UJR017 in the SRS). When that
  exists, `signin.html`'s redirect should target it instead of jumping
  directly to UJR006, and the Kardit logo + Sign-out inside UJR006
  should route through it.
- All other UJRs (UJR001, UJR005, UJR007–UJR030). Side-menu items in the
  not-yet-built portal home will eventually link to those.
- Real auth, real upload, real APIs — the prototype is screen-only.

## Running it

Open `index.html` directly, or for the most reliable experience:

```bash
cd kardit-merged
python3 -m http.server 8000
# open http://localhost:8000
```

## Brand tokens

`colors_and_type.css` at the root is the canonical brand source. UJR006
keeps a snapshot at `portal/batches/cs-tokens.css` so it stays
self-contained — if the root file changes, sync the snapshot too (or
swap UJR006's `@import` to point at `../../colors_and_type.css`).

## Affiliate Onboarding (added from React port)

A 9-screen wizard at `/onboarding/` for new affiliates registering with Kardit. Outside the portal/marketing layouts — its own shell with left progress rail.

Screens:
- `onboarding/index.html` — Start (new application + draft picker)
- `onboarding/org.html` — Step 1: Organization & contact (validation)
- `onboarding/docs.html` — Step 2: KYB / KYC document uploads (5 required)
- `onboarding/banks.html` — Step 3: Issuing bank selection (10 banks)
- `onboarding/review.html` — Step 4: Review & submit (terms checkbox gates submit)
- `onboarding/submitted.html` — Success state with case ID
- `onboarding/errors.html` — Validation-fail state with fix-now links
- `onboarding/status.html` — Application tracking timeline (clarification banner when stage requires response)
- `onboarding/respond.html` — Reply to compliance clarification

State is persisted to `sessionStorage` under `kardit_onboarding_v1` and carried across screens. Entry point: `signin.html` → "Start enrollment" CTA.

## Marketing header simplified

The `Solutions / Industries / About / Partners` desktop nav and the mobile hamburger menu have been removed from the marketing-style pages (chamsswitch-website.html, kardit-website*.html, partners-wizard variants). Headers now show only: **Logo + Sign in + Let's Talk** — matching the React port's design direction.


## Marketing site structure (current)

The marketing surface is now **7 pages**, with `index.html` as the Kardit homepage:

| File | Purpose |
|---|---|
| `index.html` | Kardit homepage — switches, products, brand statement |
| `about.html` | About — Chams Holdco, leadership, brands |
| `solutions.html` | Solutions catalogue |
| `industries.html` | Industries served |
| `partners.html` | Partner programme |
| `contact.html` | Contact form |
| `signin.html` | Auth entry — also hosts the "Become an affiliate" CTA into onboarding |

**Removed in this pass:** `chamsswitch-website.html`, `chamsswitch-partners-wizard.html`, `chamsswitch-partners-wizard-2.html`, `kardit-website.html`, `kardit-website-2.html`, `kardit-website-3.html`, `kardit-header-fixed.html`. The `assets/chamsswitch-logo.png` was also dropped since nothing references it.
