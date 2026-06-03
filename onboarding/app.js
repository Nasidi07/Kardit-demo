/* Kardit Affiliate Onboarding — shared logic across all 9 screens */

const STORAGE_KEY = "kardit_onboarding_v1";

const DEFAULT_FORM = {
  legalName: "Acme Microfinance Bank Ltd",
  regNo: "RC 1234567",
  tin: "0000000-0001",
  address: "14b Adeola Odeku, Victoria Island, Lagos",
  country: "Nigeria",
  industry: "Microfinance",
  contactName: "Adaeze Okafor",
  contactRole: "Head of Operations",
  email: "adaeze@acme.ng",
  phone: "+234 803 000 0000",
};
const DEFAULT_DOCS = { cac: null, memart: null, tin: null, directors: null, utility: null };
const DEFAULT_STATE = {
  formData: DEFAULT_FORM,
  docs: DEFAULT_DOCS,
  banks: [],
  confirmed: { terms: false, contact: false },
  caseId: "KAR-2026-04-0431",
  statusStage: "clarification",
};

function getState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {}
  return DEFAULT_STATE;
}
function setState(patch) {
  const cur = getState();
  const next = { ...cur, ...patch };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
function resetState() { sessionStorage.removeItem(STORAGE_KEY); }

const STEPS = [
  { id: "org",    n: 1, label: "Organization & Contact", meta: "Tell us about your business",  path: "org.html" },
  { id: "docs",   n: 2, label: "KYB / KYC Documents",    meta: "Upload required documents",    path: "docs.html" },
  { id: "banks",  n: 3, label: "Issuing Banks",          meta: "Select your banking partners", path: "banks.html" },
  { id: "review", n: 4, label: "Review & Submit",        meta: "Confirm and send for approval", path: "review.html" },
  { id: "status", n: 5, label: "Status & Tracking",      meta: "Track your application",        path: "status.html" },
];

const STEP_TITLES = {
  "org.html": "Organization & Contact",
  "docs.html": "KYB / KYC Documents",
  "banks.html": "Issuing Banks",
  "review.html": "Review & Submit",
  "submitted.html": "Submitted",
  "errors.html": "Errors",
  "status.html": "Application Status",
  "respond.html": "Respond to Clarification",
};

const HIDE_RAIL_PAGES = ["index.html", "submitted.html", "errors.html", "status.html", "respond.html", ""];

function activeStepFor(page) {
  if (page === "org.html") return "org";
  if (page === "docs.html") return "docs";
  if (page === "banks.html") return "banks";
  if (page === "review.html") return "review";
  if (page === "status.html" || page === "respond.html") return "status";
  return null;
}
function doneStepsFor(active) {
  if (!active) return [];
  const order = ["org", "docs", "banks", "review", "status"];
  const idx = order.indexOf(active);
  return order.slice(0, idx);
}

function getCurrentPage() {
  const path = window.location.pathname;
  const parts = path.split("/");
  return parts[parts.length - 1] || "index.html";
}

function renderShell() {
  const page = getCurrentPage();
  const active = activeStepFor(page);
  const done = doneStepsFor(active);
  const hideRail = HIDE_RAIL_PAGES.includes(page);
  const stepTitle = STEP_TITLES[page];

  // AppBar
  const appBar = `
    <header class="onb-app-bar">
      <a href="../index.html" aria-label="Kardit home" style="text-decoration:none">
        <span class="logo-mark">Kard<span class="logo-mark__i">ı</span>t</span>
      </a>
      <div class="vbar"></div>
      <nav class="crumbs" aria-label="Breadcrumb">
        <span>Affiliate Portal</span>
        ${stepTitle ? `<i data-lucide="chevron-right"></i><strong>${stepTitle}</strong>` : ""}
      </nav>
      <div class="spacer"></div>
      <a href="../contact.html" class="help-link"><i data-lucide="help-circle"></i> Help</a>
      <div class="user">
        <div class="avatar">AO</div>
        <div>
          <div class="user-name">Adaeze O.</div>
          <div class="user-org">Acme Microfinance</div>
        </div>
      </div>
    </header>
  `;

  const appBarMount = document.getElementById("appbar-mount");
  if (appBarMount) appBarMount.outerHTML = appBar;

  // Rail (skip on hide-rail pages)
  const railMount = document.getElementById("rail-mount");
  if (!railMount) return;

  if (hideRail) {
    const body = railMount.parentElement;
    if (body) body.classList.add("no-rail");
    railMount.remove();
    return;
  }

  const railItems = STEPS.map(s => {
    const isActive = s.id === active;
    const isDone = done.includes(s.id);
    const cls = [isActive && "is-active", isDone && "is-done"].filter(Boolean).join(" ");
    const circle = isDone ? "✓" : s.n;
    return `
      <a href="${s.path}">
        <li class="${cls}">
          <div class="step-dot">${circle}</div>
          <div style="flex:1">
            <div>${s.label}</div>
            <div class="step-meta">${s.meta}</div>
          </div>
        </li>
      </a>
    `;
  }).join("");

  railMount.outerHTML = `
    <aside class="onb-rail">
      <h6>Onboarding Progress</h6>
      <ol>${railItems}</ol>
      <div class="help-card">
        <div class="head"><i data-lucide="info"></i> Need help?</div>
        <div class="body">Save your progress at any time. Our team is available 9am–6pm WAT to walk you through the process.</div>
        <a href="../contact.html" class="cta">Talk to a Consultant →</a>
      </div>
    </aside>
  `;
}

// Auto-run on page load
document.addEventListener("DOMContentLoaded", () => {
  renderShell();
  if (window.lucide) lucide.createIcons();
});
