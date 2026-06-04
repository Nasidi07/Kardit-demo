/* ─────────────────────────────────────────────────────────────
   Kardit Mini CMS — UJR008 Unified Customer + Card Issuance
   Per SRS §5382. Six screens (SCR-ISS-01 through 06), two entry
   paths (cold from dashboard / warm from customer profile via
   ?customerId), session-stored payload across screens.
   ───────────────────────────────────────────────────────────── */

// Five-step linear flow (Start screen is pre-flow, has no stepper)
const STEPS = [
  { num: 1, id: "customer", label: "Customer",  href: "02-customer.html" },
  { num: 2, id: "card",     label: "Card",      href: "03-card.html"     },
  { num: 3, id: "delivery", label: "Delivery",  href: "04-delivery.html" },
  { num: 4, id: "review",   label: "Review",    href: "05-review.html"   },
  { num: 5, id: "result",   label: "Result",    href: "06-result.html"   },
];

// Mock customer pool (subset duplicated from /portal/customers/app.js — same
// shape, used for warm-start lookups via ?customerId)
const KNOWN_CUSTOMERS = {
  "CUST-2026-00345": { fullName: "Adaeze Ngozi Okafor", phone: "+234 803 555 0142", email: "adaeze.okafor@example.com", state: "Lagos", bvn: "22123456789", street: "14 Bourdillon Road, Ikoyi", lga: "Eti-Osa" },
  "CUST-2026-00344": { fullName: "Tunde Akinwale Bakare", phone: "+234 805 442 0098", email: "tunde.bakare@example.com", state: "Lagos", bvn: "22198765432", street: "27 Awolowo Road, Ikoyi", lga: "Eti-Osa" },
  "CUST-2026-00343": { fullName: "Chiamaka Eze", phone: "+234 807 332 5511", email: "chiamaka.eze@example.com", state: "Lagos", bvn: "22155443322", street: "5 Adeola Odeku Street, VI", lga: "Eti-Osa" },
};

// Banks + products catalog (per SRS request payload — bankId + productId)
const BANKS = [
  { id: "BNK-ZEN-002", code: "zenith", name: "Zenith Bank",   sub: "Most popular · Verve" },
  { id: "BNK-GTB-001", code: "gtbank", name: "GTBank",        sub: "Verve, Mastercard" },
  { id: "BNK-ACC-005", code: "access", name: "Access Bank",   sub: "Verve, USD products" },
  { id: "BNK-UBA-003", code: "uba",    name: "UBA",           sub: "Verve, AfriCard" },
  { id: "BNK-FCM-004", code: "fcmb",   name: "FCMB",          sub: "Verve" },
];

const PRODUCTS = {
  "BNK-ZEN-002": [
    { id: "PRD-ZEN-VRV-STD-01", name: "Verve Prepaid Standard", style: "standard", currency: "NGN", fee: "Issuance ₦1,000 · Maintenance ₦100/mo", limits: "Daily ₦200,000 · Monthly ₦1,000,000" },
    { id: "PRD-ZEN-VRV-GLD-01", name: "Verve Gold",             style: "gold",     currency: "NGN", fee: "Issuance ₦5,000 · Maintenance ₦500/mo", limits: "Daily ₦1,000,000 · Monthly ₦5,000,000" },
    { id: "PRD-ZEN-VIR-USD-01", name: "Verve USD Virtual",      style: "usd",      currency: "USD", fee: "Issuance $2 · Maintenance $1/mo",       limits: "Daily $2,000 · Monthly $10,000" },
  ],
  "BNK-GTB-001": [
    { id: "PRD-GTB-VRV-STD-01", name: "Verve Prepaid Standard", style: "standard", currency: "NGN", fee: "Issuance ₦1,500 · Maintenance ₦100/mo", limits: "Daily ₦200,000 · Monthly ₦1,000,000" },
    { id: "PRD-GTB-VRV-PLT-01", name: "Verve Platinum",         style: "platinum", currency: "NGN", fee: "Issuance ₦10,000 · Maintenance ₦1,000/mo", limits: "Daily ₦5,000,000 · Monthly ₦20,000,000" },
  ],
  "BNK-ACC-005": [
    { id: "PRD-ACC-VRV-STD-01", name: "Verve Prepaid Standard", style: "standard", currency: "NGN", fee: "Issuance ₦1,000 · Maintenance ₦100/mo", limits: "Daily ₦200,000 · Monthly ₦1,000,000" },
    { id: "PRD-ACC-VIR-USD-01", name: "Access USD Virtual",     style: "usd",      currency: "USD", fee: "Issuance $5 · Maintenance $1.50/mo",    limits: "Daily $2,500 · Monthly $15,000" },
  ],
  "BNK-UBA-003": [
    { id: "PRD-UBA-VRV-STD-01", name: "Verve Prepaid Standard", style: "standard", currency: "NGN", fee: "Issuance ₦1,000 · Maintenance ₦100/mo", limits: "Daily ₦200,000 · Monthly ₦1,000,000" },
    { id: "PRD-UBA-AFR-USD-01", name: "AfriCard USD",           style: "usd",      currency: "USD", fee: "Issuance $3 · Maintenance $1/mo",       limits: "Daily $2,000 · Monthly $10,000" },
  ],
  "BNK-FCM-004": [
    { id: "PRD-FCM-VRV-STD-01", name: "Verve Prepaid Standard", style: "standard", currency: "NGN", fee: "Issuance ₦1,500 · Maintenance ₦150/mo", limits: "Daily ₦200,000 · Monthly ₦1,000,000" },
  ],
};

const STATE_KEY = "kardit_iss_state_v1";

function getState() {
  try { return JSON.parse(sessionStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; }
}
function setState(patch) {
  const cur = getState();
  const next = { ...cur, ...patch };
  sessionStorage.setItem(STATE_KEY, JSON.stringify(next));
  return next;
}
function clearState() { sessionStorage.removeItem(STATE_KEY); }
function getParam(k) { return new URLSearchParams(window.location.search).get(k); }

function fmtMoney(amt, cur) {
  const s = (cur === "USD" ? "$" : "₦") + amt.toLocaleString();
  return s;
}
function findBank(id)    { return BANKS.find(b => b.id === id) || null; }
function findProduct(bankId, productId) {
  return (PRODUCTS[bankId] || []).find(p => p.id === productId) || null;
}
function genIdempotencyKey() {
  return "idem-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
}
function genRequestId() {
  return "REQ-ISS-" + String(128 + Math.floor(Math.random() * 900)).padStart(6, "0");
}
function genCardId() {
  return "CARD-2026-" + String(1000 + Math.floor(Math.random() * 9000)).padStart(6, "0");
}
function genCustomerId() {
  return "CUST-2026-" + String(346 + Math.floor(Math.random() * 50)).padStart(5, "0");
}
function genVaId() {
  return "VA-2026-" + String(81 + Math.floor(Math.random() * 200)).padStart(5, "0");
}
function maskPan() {
  const bin = ["411111", "522222", "506099", "539923"][Math.floor(Math.random() * 4)];
  const last4 = String(1000 + Math.floor(Math.random() * 9000));
  return `${bin}******${last4}`;
}

// ───── Chrome rendering ─────

function renderAppBar(activeStep) {
  const trail = `
    <a href="../index.html">Dashboard</a>
    <i data-lucide="chevron-right"></i>
    <span class="crumb-faint">Issue card</span>
    <i data-lucide="chevron-right"></i>
    <strong>${activeStep ? STEPS[activeStep - 1].label : "Start"}</strong>
  `;
  return `
    <header class="scr-app-bar">
      <a href="../index.html" class="logo-link" aria-label="Kardit home">
        <span class="logo-mark">Kard<span class="logo-mark__i">i</span>t</span>
      </a>
      <div class="vbar"></div>
      <nav class="crumbs" aria-label="Breadcrumb">${trail}</nav>
      <div class="spacer"></div>
      <a href="../../contact.html" class="help-link">
        <i data-lucide="help-circle"></i> Help
      </a>
      <div class="user">
        <div class="avatar">AO</div>
        <div class="user-meta">
          <div class="user-name">Adaeze O.</div>
          <div class="user-org">
            <a href="../../signin.html" class="signout-link">Sign out</a>
          </div>
        </div>
      </div>
    </header>
  `;
}

function renderHStepper(activeStep) {
  if (!activeStep) return "";
  const state = getState();
  const isVirtual = state.productType === "VIRTUAL";
  return `
    <nav class="hstepper" aria-label="Issuance flow">
      ${STEPS.map(s => {
        const isActive = s.num === activeStep;
        const isDone   = s.num < activeStep;
        // Delivery step is N/A for virtual cards
        const isSkipped = s.id === "delivery" && isVirtual && state.productType;
        const cls = ["hstep",
          isActive && "is-active",
          isDone && "is-done",
          isSkipped && "is-skipped",
        ].filter(Boolean).join(" ");
        const circle = isDone ? `<i data-lucide="check"></i>` : (isSkipped ? "—" : s.num);
        const skipLabel = isSkipped ? ' <span style="font-size:9px;opacity:0.6">(virtual)</span>' : "";
        return `
          <a class="${cls}" href="${isSkipped ? "#" : s.href}" ${isSkipped ? 'onclick="event.preventDefault()"' : ""}>
            <span class="hstep__circle">${circle}</span>
            <span>${s.label}${skipLabel}</span>
          </a>
        `;
      }).join("")}
    </nav>
  `;
}

function initPage(activeStep) {
  const appbarMount = document.getElementById("appbar-mount");
  if (appbarMount) appbarMount.outerHTML = renderAppBar(activeStep);
  const hstepperMount = document.getElementById("hstepper-mount");
  if (hstepperMount) hstepperMount.outerHTML = renderHStepper(activeStep);
  if (window.lucide) lucide.createIcons();
}

// ───── Per-screen handlers ─────

// 01-start.html — detect warm start and offer routing
function initStart() {
  const customerId = getParam("customerId");
  if (customerId && KNOWN_CUSTOMERS[customerId]) {
    // Warm start: pre-seed state and route directly to card selection
    const c = KNOWN_CUSTOMERS[customerId];
    setState({ customerId, customer: c });
    document.getElementById("warm-banner").style.display = "flex";
    const nameEl = document.getElementById("warm-name");
    const idEl   = document.getElementById("warm-id");
    if (nameEl) nameEl.textContent = c.fullName;
    if (idEl)   idEl.textContent = customerId;
    const cta = document.getElementById("warm-cta");
    if (cta) cta.href = "03-card.html";
    document.getElementById("cold-cta").style.display = "none";
  }
}

// 02-customer.html — capture form (mirrors UJR005)
function initCustomerCapture() {
  const form = document.getElementById("issuance-customer-form");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(form);
    const c = {
      fullName: [fd.get("firstName"), fd.get("middleName"), fd.get("lastName")].filter(Boolean).join(" "),
      phone:    fd.get("phone"),
      email:    fd.get("email"),
      state:    fd.get("state") || "Lagos",
      bvn:      fd.get("bvn"),
      street:   fd.get("street"),
      lga:      fd.get("lga"),
    };
    const customerId = genCustomerId();
    setState({ customerId, customer: c });
    const btn = document.getElementById("save-continue");
    if (btn) { btn.disabled = true; btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Saving…`; if (window.lucide) lucide.createIcons(); }
    setTimeout(() => { window.location.href = "03-card.html"; }, 600);
  });
}

// 03-card.html — bank, product, type selection
function initCardSelection() {
  const state = getState();
  if (!state.customerId) { window.location.href = "01-start.html"; return; }

  // Render the "issuing card for" banner
  const cName = document.getElementById("ctx-name");
  const cId   = document.getElementById("ctx-id");
  if (cName) cName.textContent = state.customer.fullName;
  if (cId)   cId.textContent   = state.customerId;

  // Render banks
  const banksWrap = document.getElementById("banks-wrap");
  banksWrap.innerHTML = BANKS.map(b => `
    <label class="option-card" data-bank="${b.id}">
      <input type="radio" name="bank" value="${b.id}">
      <span class="check"></span>
      <div class="option-head">
        <div class="option-logo ${b.code}">${b.name.split(" ")[0].slice(0, 4).toUpperCase()}</div>
        <div>
          <div class="option-name">${b.name}</div>
          <div class="option-meta">${b.sub}</div>
        </div>
      </div>
    </label>
  `).join("");

  const productsWrap   = document.getElementById("products-wrap");
  const productSection = document.getElementById("product-section");
  const typeSection    = document.getElementById("type-section");
  const currencyPill   = document.getElementById("currency-pill");
  const continueBtn    = document.getElementById("continue-btn");

  function renderProducts(bankId) {
    productSection.style.display = "block";
    typeSection.style.display = "none";
    productsWrap.innerHTML = (PRODUCTS[bankId] || []).map(p => `
      <label class="product-card" data-product="${p.id}">
        <input type="radio" name="product" value="${p.id}">
        <div class="product-chip ${p.style}">${p.currency}</div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-meta">${p.limits}</div>
          <div class="product-fee">${p.fee}</div>
        </div>
        <span class="check"></span>
      </label>
    `).join("");
    if (window.lucide) lucide.createIcons();
    productsWrap.querySelectorAll(".product-card").forEach(card => {
      card.addEventListener("click", () => {
        productsWrap.querySelectorAll(".product-card").forEach(c => c.classList.remove("is-selected"));
        card.classList.add("is-selected");
        card.querySelector("input").checked = true;
        const productId = card.getAttribute("data-product");
        const product = findProduct(bankId, productId);
        typeSection.style.display = "block";
        currencyPill.innerHTML = `<i data-lucide="circle-dollar-sign"></i> Currency: <span class="strong">${product.currency}</span> · auto-derived from product`;
        if (window.lucide) lucide.createIcons();
        // Reset type selection
        document.querySelectorAll(".type-tile").forEach(t => t.classList.remove("is-selected"));
        document.querySelectorAll(".type-tile input").forEach(i => { i.checked = false; });
        continueBtn.disabled = true;
        setState({ bankId, productId, currency: product.currency, productType: null });
      });
    });
  }

  banksWrap.querySelectorAll(".option-card").forEach(card => {
    card.addEventListener("click", () => {
      banksWrap.querySelectorAll(".option-card").forEach(c => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      card.querySelector("input").checked = true;
      const bankId = card.getAttribute("data-bank");
      setState({ bankId, productId: null, productType: null });
      renderProducts(bankId);
    });
  });

  document.querySelectorAll(".type-tile").forEach(tile => {
    tile.addEventListener("click", () => {
      document.querySelectorAll(".type-tile").forEach(t => t.classList.remove("is-selected"));
      tile.classList.add("is-selected");
      tile.querySelector("input").checked = true;
      const productType = tile.getAttribute("data-type");
      setState({ productType });
      continueBtn.disabled = false;
    });
  });

  continueBtn.addEventListener("click", () => {
    const s = getState();
    if (!s.bankId || !s.productId || !s.productType) return;
    // Virtual cards skip delivery
    window.location.href = s.productType === "PHYSICAL" ? "04-delivery.html" : "05-review.html";
  });

  // If we already had a selection (back-navigation), restore visually
  if (state.bankId) {
    banksWrap.querySelector(`[data-bank="${state.bankId}"]`)?.click();
    if (state.productId) {
      setTimeout(() => productsWrap.querySelector(`[data-product="${state.productId}"]`)?.click(), 50);
      if (state.productType) {
        setTimeout(() => document.querySelector(`.type-tile[data-type="${state.productType}"]`)?.click(), 100);
      }
    }
  }
}

// 04-delivery.html — physical delivery details
function initDelivery() {
  const state = getState();
  if (!state.customerId) { window.location.href = "01-start.html"; return; }
  if (state.productType === "VIRTUAL") { window.location.href = "05-review.html"; return; }

  // Pre-fill customer address as default
  const useDefault = document.getElementById("use-default-addr");
  const altWrap = document.getElementById("alt-address-wrap");
  const addrSummary = document.getElementById("default-addr-summary");
  if (addrSummary) addrSummary.textContent = `${state.customer.street}, ${state.customer.lga}, ${state.customer.state}`;

  useDefault.addEventListener("change", () => {
    altWrap.style.display = useDefault.checked ? "none" : "block";
  });

  const form = document.getElementById("delivery-form");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(form);
    const delivery = {
      method:  fd.get("method"),
      useDefault: useDefault.checked,
      altStreet: fd.get("altStreet") || null,
      altLga:    fd.get("altLga") || null,
      altState:  fd.get("altState") || null,
      notes:     fd.get("notes") || null,
    };
    setState({ delivery });
    window.location.href = "05-review.html";
  });
}

// 05-review.html — render the full payload for confirmation
function initReview() {
  const state = getState();
  if (!state.customerId || !state.productId || !state.productType) {
    window.location.href = "01-start.html"; return;
  }
  const bank    = findBank(state.bankId);
  const product = findProduct(state.bankId, state.productId);
  const c       = state.customer;

  document.getElementById("rv-customer").innerHTML = `
    <dl class="profile-specs">
      <div><dt>Full name</dt><dd>${c.fullName}</dd></div>
      <div><dt>Customer ID</dt><dd class="mono">${state.customerId}</dd></div>
      <div><dt>Mobile</dt><dd class="mono">${c.phone}</dd></div>
      <div><dt>Email</dt><dd>${c.email || '<span class="muted">not provided</span>'}</dd></div>
      <div><dt>BVN</dt><dd class="mono">${(c.bvn || "").replace(/^(\d{3})\d{6}(\d{2})$/, "$1******$2") || "—"}</dd></div>
      <div><dt>State</dt><dd>${c.state}</dd></div>
    </dl>
  `;

  document.getElementById("rv-card").innerHTML = `
    <dl class="profile-specs">
      <div><dt>Issuing bank</dt><dd>${bank.name}<br/><span class="mono" style="font-size:11px;color:var(--cs-ink-100)">${bank.id}</span></dd></div>
      <div><dt>Product</dt><dd>${product.name}<br/><span class="mono" style="font-size:11px;color:var(--cs-ink-100)">${product.id}</span></dd></div>
      <div><dt>Card type</dt><dd>${state.productType.charAt(0) + state.productType.slice(1).toLowerCase()}</dd></div>
      <div><dt>Currency</dt><dd>${product.currency}</dd></div>
      <div><dt>Limits</dt><dd>${product.limits}</dd></div>
      <div><dt>Fees</dt><dd>${product.fee}</dd></div>
    </dl>
  `;

  const deliveryPanel = document.getElementById("rv-delivery-panel");
  if (state.productType === "PHYSICAL" && state.delivery) {
    const d = state.delivery;
    const addr = d.useDefault
      ? `${c.street}, ${c.lga}, ${c.state}`
      : `${d.altStreet}, ${d.altLga}, ${d.altState}`;
    document.getElementById("rv-delivery").innerHTML = `
      <dl class="profile-specs">
        <div><dt>Method</dt><dd>${d.method}</dd></div>
        <div><dt>Address</dt><dd style="text-align:right">${addr}</dd></div>
        ${d.notes ? `<div><dt>Notes</dt><dd>${d.notes}</dd></div>` : ""}
        <div><dt>Estimated arrival</dt><dd>5–10 business days</dd></div>
      </dl>
    `;
  } else {
    deliveryPanel.style.display = "none";
  }

  // Idempotency key (FR-ISS-S03)
  const idemKey = state.idempotencyKey || genIdempotencyKey();
  const reqId = state.requestId || genRequestId();
  setState({ idempotencyKey: idemKey, requestId: reqId });
  document.getElementById("idempotency-key").textContent = idemKey;
  document.getElementById("request-id").textContent = reqId;

  // Submit
  document.getElementById("issue-btn").addEventListener("click", () => {
    const btn = document.getElementById("issue-btn");
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Issuing card…`;
    if (window.lucide) lucide.createIcons();

    // Simulate the API call: persist outcome to state
    setTimeout(() => {
      const outcome = {
        cardId:       genCardId(),
        maskedPan:    maskPan(),
        expiryMonth:  String(1 + Math.floor(Math.random() * 12)).padStart(2, "0"),
        expiryYear:   String(28 + Math.floor(Math.random() * 4)),
        status:       state.productType === "VIRTUAL" ? "ACTIVE" : "PERSONALIZING",
        virtualAccount: {
          virtualAccountId: genVaId(),
          status: "ACTIVE",
        },
        createdAt: new Date().toISOString(),
      };
      setState({ outcome });
      window.location.href = "06-result.html";
    }, 1400);
  });

  if (window.lucide) lucide.createIcons();
}

// 06-result.html — render success state (virtual or physical)
function initResult() {
  const state = getState();
  if (!state.outcome) { window.location.href = "01-start.html"; return; }

  const o = state.outcome;
  const bank    = findBank(state.bankId);
  const product = findProduct(state.bankId, state.productId);
  const isVirtual = state.productType === "VIRTUAL";

  // Title + sub
  document.getElementById("result-title").textContent = isVirtual ? "Card issued" : "Card sent for personalization";
  document.getElementById("result-sub").innerHTML = isVirtual
    ? `Virtual card is <strong>ACTIVE</strong> and ready for funding. Linked virtual account provisioned per FR-ISS-VA-01.`
    : `Physical card is <strong>PERSONALIZING</strong>. Bureau push succeeded — typical personalization 24–48 hours.`;

  // Icon variant
  const icon = document.getElementById("result-icon");
  if (!isVirtual) icon.classList.add("personalizing");
  icon.innerHTML = isVirtual
    ? `<i data-lucide="check"></i>`
    : `<i data-lucide="clock"></i>`;

  // Card chip display
  const cleanPan = (o.maskedPan || "").replace(/\s|\*|•/g, "");
  const pan1 = cleanPan.slice(0, 4) || "••••";
  const pan4 = cleanPan.slice(-4) || "••••";
  let variantClass = "";
  if (!isVirtual) variantClass = "physical";
  else if (/gold/i.test(product.name)) variantClass = "gold";
  else if (/platinum/i.test(product.name)) variantClass = "platinum";
  else if (/usd/i.test(product.name) || product.currency === "USD") variantClass = "usd";

  document.getElementById("issued-card").innerHTML = `
    <div class="ic-header">
      <span class="ic-bank">${bank.name.toUpperCase()}<small>${product.name.toUpperCase()}</small></span>
      <span class="ic-status">${o.status}</span>
    </div>
    <div class="ic-chip-row">
      <span class="ic-chip"></span>
      <svg class="ic-contactless" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M8 9c1.5-1.5 3.5-1.5 5 0"/>
        <path d="M6 12c3-3 7-3 10 0"/>
        <path d="M4 15c4-4 10-4 14 0"/>
      </svg>
    </div>
    <div class="ic-pan">
      <span>${pan1}</span><span>••••</span><span>••••</span><span>${pan4}</span>
    </div>
    <div class="ic-footer">
      <div class="ic-col">
        <span class="ic-label">Cardholder</span>
        <span class="ic-value">${state.customer.fullName.toUpperCase()}</span>
      </div>
      <div class="ic-col">
        <span class="ic-label">Valid thru</span>
        <span class="ic-value">${o.expiryMonth}/${o.expiryYear}</span>
      </div>
      <div class="ic-scheme">
        <div class="ic-scheme-mark"><span class="blend"></span></div>
        <span class="ic-scheme-name">Verve</span>
      </div>
    </div>
  `;
  const issuedCard = document.getElementById("issued-card");
  if (variantClass) issuedCard.classList.add(variantClass);

  // VA strip
  document.getElementById("va-value").textContent = o.virtualAccount.virtualAccountId;

  // What's next
  const nextGrid = document.getElementById("next-grid");
  if (isVirtual) {
    nextGrid.innerHTML = `
      <a class="next-link" href="../load-funds/01-form.html?cardId=${encodeURIComponent(o.cardId)}">
        <span class="nl-icon"><i data-lucide="wallet"></i></span>
        <div><div class="nl-label">Load funds</div><div class="nl-meta">UJR012</div></div>
      </a>
      <a class="next-link" href="../card/index.html?cardId=${encodeURIComponent(o.cardId)}">
        <span class="nl-icon"><i data-lucide="circle-dollar-sign"></i></span>
        <div><div class="nl-label">View balance</div><div class="nl-meta">UJR015</div></div>
      </a>
      <a class="next-link" href="../customers/profile.html?ref=${encodeURIComponent(state.customerId)}">
        <span class="nl-icon"><i data-lucide="user"></i></span>
        <div><div class="nl-label">Open customer</div><div class="nl-meta">${state.customerId}</div></div>
      </a>
    `;
  } else {
    nextGrid.innerHTML = `
      <a class="next-link disabled" href="#" onclick="event.preventDefault(); alert('UJR027 (Physical card tracking) — coming later.');">
        <span class="nl-icon"><i data-lucide="truck"></i></span>
        <div><div class="nl-label">Track delivery</div><div class="nl-meta">UJR027</div></div>
      </a>
      <a class="next-link disabled" href="#" onclick="event.preventDefault(); alert('Funding unlocks once card status is ACTIVE.');">
        <span class="nl-icon"><i data-lucide="wallet"></i></span>
        <div><div class="nl-label">Load funds</div><div class="nl-meta">Locked until ACTIVE</div></div>
      </a>
      <a class="next-link" href="../customers/profile.html?ref=${encodeURIComponent(state.customerId)}">
        <span class="nl-icon"><i data-lucide="user"></i></span>
        <div><div class="nl-label">Open customer</div><div class="nl-meta">${state.customerId}</div></div>
      </a>
    `;
  }

  // Card id strip
  document.getElementById("card-id").textContent = o.cardId;

  // Clear state on "issue another" so the next flow starts clean
  document.getElementById("issue-another").addEventListener("click", () => {
    clearState();
  });

  if (window.lucide) lucide.createIcons();
}
