/* ─────────────────────────────────────────────────────────────
   Kardit Mini CMS — Card Servicing module
   : View balance (SCR-CARD detail, )
   : Freeze card ()
   : Unfreeze card ()
   ───────────────────────────────────────────────────────────── */

// Mock customer dataset — subset duplicated from /portal/customers/app.js for
// card lookups. Same shape, same cards. Real impl would call /api/v1/customers/{id}
// or /api/v1/cards/{cardId} directly.
const CARD_OWNERS = [
  {
    ref: "CUST-2026-00344",
    fullName: "Tunde Bakare",
    phone: "+234 805 123 4567",
    cards: [
      { id: "CARD-2026-VRP01029", maskedPan: "5061 ** ** ** 4421", expiry: "10/29", product: "Verve Prepaid Standard", bank: "Zenith Bank", bankCode: "BNK-ZEN-002", type: "VIRTUAL", status: "ACTIVE", createdAt: "2026-05-10T14:30:00Z" },
    ],
  },
  {
    ref: "CUST-2026-00343",
    fullName: "Chiamaka Eze",
    phone: "+234 813 222 8800",
    cards: [
      { id: "CARD-2026-VRP01028", maskedPan: "5061 ** ** ** 0091", expiry: "12/29", product: "Verve Prepaid Standard", bank: "Zenith Bank", bankCode: "BNK-ZEN-002", type: "VIRTUAL", status: "ACTIVE", createdAt: "2026-05-09T11:25:00Z" },
      { id: "CARD-2026-VRP00984", maskedPan: "5061 ** ** ** 7732", expiry: "06/28", product: "Verve Prepaid Standard", bank: "GTBank", bankCode: "BNK-GTB-001", type: "PHYSICAL", status: "ACTIVE", createdAt: "2026-04-15T09:30:00Z" },
    ],
  },
  {
    ref: "CUST-2026-00341",
    fullName: "Ngozi Anyanwu",
    phone: "+234 818 110 3344",
    cards: [
      { id: "CARD-2026-VRP00973", maskedPan: "5061 ** ** ** 5566", expiry: "08/29", product: "Verve Prepaid Standard", bank: "Access Bank", bankCode: "BNK-ACC-003", type: "VIRTUAL", status: "ACTIVE", createdAt: "2026-05-08T15:30:00Z" },
    ],
  },
];

const FREEZE_REASONS = [
  { value: "CUSTOMER_REQUEST",  label: "Customer request" },
  { value: "SUSPECTED_FRAUD",   label: "Suspected fraud" },
  { value: "CARD_LOST_STOLEN",  label: "Card lost / stolen" },
  { value: "COMPLIANCE_HOLD",   label: "Compliance hold" },
  { value: "INTERNAL_REVIEW",   label: "Internal review" },
];
const UNFREEZE_REASONS = [
  { value: "ISSUE_RESOLVED",     label: "Issue resolved" },
  { value: "FALSE_FLAG",         label: "False flag — fraud not confirmed" },
  { value: "CUSTOMER_REQUEST",   label: "Customer request" },
  { value: "COMPLIANCE_CLEARED", label: "Compliance review cleared" },
];

// ───── Status override store (sessionStorage so freeze/unfreeze persist
// across pages until the tab is closed) ─────
const OVERRIDE_KEY = "kardit_card_overrides_v1";
function getOverrides() {
  try { return JSON.parse(sessionStorage.getItem(OVERRIDE_KEY) || "{}"); } catch { return {}; }
}
function setOverride(cardId, patch) {
  const all = getOverrides();
  all[cardId] = { ...(all[cardId] || {}), ...patch };
  sessionStorage.setItem(OVERRIDE_KEY, JSON.stringify(all));
}

// ───── Card lookup ─────
function findCard(cardId) {
  // First check the static seed pool
  for (const owner of CARD_OWNERS) {
    const c = owner.cards.find(c => c.id === cardId);
    if (c) {
      const ov = getOverrides()[cardId];
      return {
        ...c,
        status: ov?.status || c.status,
        lastChangedAt: ov?.changedAt || null,
        cmsRef: ov?.cmsRef || null,
        owner,
      };
    }
  }
  // Then check the just-minted-card pool (from  result)
  try {
    const iss = JSON.parse(sessionStorage.getItem("kardit_iss_state_v1") || "{}");
    if (iss.outcome && iss.outcome.cardId === cardId) {
      const ov = getOverrides()[cardId];
      return {
        id: iss.outcome.cardId,
        maskedPan: iss.outcome.maskedPan,
        expiry: `${iss.outcome.expiryMonth}/${iss.outcome.expiryYear}`,
        product: "Verve Prepaid Standard",
        bank: "Zenith Bank",
        bankCode: iss.bankId || "BNK-ZEN-002",
        type: iss.productType || "VIRTUAL",
        status: ov?.status || iss.outcome.status,
        createdAt: iss.outcome.createdAt,
        lastChangedAt: ov?.changedAt || null,
        cmsRef: ov?.cmsRef || null,
        owner: {
          ref: iss.customerId,
          fullName: iss.customer?.fullName || "Recently captured customer",
          phone: iss.customer?.phone || "",
        },
      };
    }
  } catch (e) {}
  return null;
}

// ───── Deterministic mock balance based on card id ─────
function mockBalance(cardId) {
  // Simple hash → pseudo-random
  let h = 0;
  for (let i = 0; i < cardId.length; i++) h = ((h << 5) - h + cardId.charCodeAt(i)) | 0;
  const seed = Math.abs(h);
  const ledger = 50000 + (seed % 450000);
  const reserved = (seed % 5000);
  return {
    ledgerBalance: ledger,
    availableBalance: ledger - reserved,
    currency: "NGN",
  };
}

// Mock recent transactions (placeholder for )
function mockTxns(cardId) {
  const seed = cardId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const pool = [
    { type: "out", merchant: "Chowdeck", category: "Food delivery",  amount: -3500 },
    { type: "out", merchant: "Bolt",     category: "Transport",      amount: -2200 },
    { type: "in",  merchant: "Funding",  category: "Affiliate load", amount:  50000 },
    { type: "out", merchant: "Spar Lekki", category: "Groceries",    amount: -18450 },
    { type: "out", merchant: "Netflix",  category: "Subscription",   amount: -4500 },
  ];
  // Vary count per card based on seed
  const count = 3 + (seed % 3);
  return pool.slice(0, count);
}

function fmtAmount(amt, currency) {
  const sign = amt < 0 ? "-" : "";
  const sym = currency === "USD" ? "$" : "₦";
  return sign + sym + Math.abs(amt).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtMoneyPlain(amt, currency) {
  const sym = currency === "USD" ? "$" : "₦";
  return sym + amt.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function getParam(k) { return new URLSearchParams(window.location.search).get(k); }
function genCmsRef(prefix) {
  return prefix + "-" + String(8821000 + Math.floor(Math.random() * 9999)).padStart(7, "0");
}
function genReqId(prefix) {
  return prefix + "-" + String(20 + Math.floor(Math.random() * 999)).padStart(5, "0");
}
function genIdemKey(prefix) {
  return prefix + "-idem-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
}

// ───── Chrome rendering ─────
function renderAppBar(currentLabel, currentSub) {
  return `
    <header class="scr-app-bar">
      <a href="../index.html" class="logo-link" aria-label="Kardit home">
        <span class="logo-mark">Kard<span class="logo-mark__i">i</span>t</span>
      </a>
      <div class="vbar"></div>
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="../index.html">Dashboard</a>
        <i data-lucide="chevron-right"></i>
        <a href="../customers/index.html">Customers</a>
        <i data-lucide="chevron-right"></i>
        <strong>${currentLabel}</strong>
        ${currentSub ? `<span class="crumb-faint" style="font-family:var(--font-mono);font-size:11px">· ${currentSub}</span>` : ""}
      </nav>
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
function mountAppBar(currentLabel, currentSub) {
  const m = document.getElementById("appbar-mount");
  if (m) m.outerHTML = renderAppBar(currentLabel, currentSub);
  if (window.lucide) lucide.createIcons();
}

// ───── Renderers ─────

function renderCardVisual(card, cardholderName, klass) {
  const statusClass = card.status === "FROZEN" ? "frozen" : (card.status === "TERMINATED" ? "terminated" : "");
  // Determine the bank visual style: gold for premium products, usd for USD, physical, otherwise default green
  let typeClass = "";
  if (card.type === "PHYSICAL") typeClass = "physical";
  else if (/gold/i.test(card.product || "")) typeClass = "gold";
  else if (/platinum/i.test(card.product || "")) typeClass = "platinum";
  else if (/usd/i.test(card.product || "")) typeClass = "usd";

  const classes = ["card-visual", typeClass, statusClass, klass || ""].filter(Boolean).join(" ");

  // Parse PAN into four 4-digit groups (mask middle two)
  const cleanPan = (card.maskedPan || "").replace(/\s|\*|•/g, "");
  const groups = [
    cleanPan.slice(0, 4) || "••••",
    "••••",
    "••••",
    cleanPan.slice(-4) || "••••",
  ];

  return `
    <div class="${classes}">
      <div class="cv-header">
        <span class="cv-bank">${card.bank.toUpperCase()}<small>${(card.product || "VERVE · KARDIT").toUpperCase()}</small></span>
        <span class="cv-status">${card.status}</span>
      </div>
      <div class="cv-chip-row">
        <span class="cv-chip"></span>
        <svg class="cv-contactless" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M8 9c1.5-1.5 3.5-1.5 5 0"/>
          <path d="M6 12c3-3 7-3 10 0"/>
          <path d="M4 15c4-4 10-4 14 0"/>
        </svg>
      </div>
      <div class="cv-pan">
        <span>${groups[0]}</span><span>${groups[1]}</span><span>${groups[2]}</span><span>${groups[3]}</span>
      </div>
      <div class="cv-footer">
        <div class="cv-col">
          <span class="cv-label">Cardholder</span>
          <span class="cv-value">${cardholderName.toUpperCase()}</span>
        </div>
        <div class="cv-col">
          <span class="cv-label">Valid thru</span>
          <span class="cv-value">${card.expiry}</span>
        </div>
        <div class="cv-scheme">
          <div class="cv-scheme-mark"><span class="blend"></span></div>
          <span class="cv-scheme-name">Verve</span>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
//  — View balance (card detail page)
// ─────────────────────────────────────────────────────────────
function initCardDetail() {
  const cardId = getParam("cardId");
  if (!cardId) { renderNotFound(null); return; }
  const card = findCard(cardId);
  if (!card) { renderNotFound(cardId); return; }

  mountAppBar(card.owner.fullName, cardId);

  // Post-action toast (?just=froze | unfroze)
  const just = getParam("just");
  const toastWrap = document.getElementById("toast-wrap");
  if (just === "froze") {
    toastWrap.innerHTML = `
      <div class="action-toast warn">
        <span class="ico"><i data-lucide="snowflake"></i></span>
        <div class="body">
          <div class="ttl">Card frozen</div>
          <div class="mta">Status changed from ACTIVE → FROZEN. <span class="ref">CMS ref <strong>${card.cmsRef || "—"}</strong></span></div>
        </div>
      </div>
    `;
  } else if (just === "unfroze") {
    toastWrap.innerHTML = `
      <div class="action-toast">
        <span class="ico"><i data-lucide="check"></i></span>
        <div class="body">
          <div class="ttl">Card unfrozen</div>
          <div class="mta">Status changed from FROZEN → ACTIVE. <span class="ref">CMS ref <strong>${card.cmsRef || "—"}</strong></span></div>
        </div>
      </div>
    `;
  }

  // Card visual
  document.getElementById("card-visual-mount").innerHTML = renderCardVisual(card, card.owner.fullName);

  // Balance (-12)
  const b = mockBalance(card.id);
  // Simulate cached vs CMS based on cardId hash (just for demo realism)
  const isCached = (cardId.charCodeAt(cardId.length - 1) % 4) === 0;
  const source = isCached ? "CACHED" : "CMS";
  const retrievedAt = new Date(Date.now() - (isCached ? 12 * 60 * 1000 : 30 * 1000)).toISOString();

  document.getElementById("balance-mount").innerHTML = `
    <div class="balance-card">
      <div class="balance-head">
        <span class="balance-label">Available balance · -12</span>
        <span class="balance-source-pill ${isCached ? "cached" : ""}">
          ${isCached
            ? `<i data-lucide="database"></i> CACHED`
            : `<i data-lucide="zap"></i> CMS · LIVE`}
        </span>
      </div>
      <div>
        <span class="balance-amount">${b.availableBalance.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span class="balance-currency">${b.currency}</span>
      </div>
      <div class="balance-meta">
        <div>
          <div class="item-label">Ledger balance</div>
          <div class="item-value">${fmtMoneyPlain(b.ledgerBalance, b.currency)}</div>
        </div>
        <div style="text-align:right">
          <div class="item-label">Retrieved at</div>
          <div class="item-value">${fmtTime(retrievedAt)}</div>
        </div>
      </div>
      ${isCached ? `
        <div class="balance-stale-banner">
          <i data-lucide="alert-triangle"></i>
          <div><strong>Cached snapshot.</strong> CMS was unreachable — value may not be real-time (-14).</div>
        </div>
      ` : ""}
    </div>
  `;

  // Action grid — depends on status
  const isActive = card.status === "ACTIVE";
  const isFrozen = card.status === "FROZEN";
  const isTerminated = card.status === "TERMINATED";
  document.getElementById("actions-mount").innerHTML = `
    <div class="card-actions-grid">
      ${isActive ? `
        <a class="card-action danger" href="freeze.html?cardId=${encodeURIComponent(card.id)}">
          <i data-lucide="snowflake"></i><span class="label">Freeze</span>
        </a>` : ""}
      ${isFrozen ? `
        <a class="card-action" href="unfreeze.html?cardId=${encodeURIComponent(card.id)}">
          <i data-lucide="play"></i><span class="label">Unfreeze</span>
        </a>` : ""}
      <a class="card-action ${isTerminated ? "disabled" : ""}" href="#" onclick="event.preventDefault(); alert(' (Transactions) — coming later');">
        <i data-lucide="list"></i><span class="label">Transactions</span>
      </a>
      <a class="card-action ${isTerminated || !isActive ? "disabled" : ""}" href="${isActive ? `../load-funds/01-form.html?cardId=${encodeURIComponent(card.id)}` : '#'}" ${!isActive ? 'onclick="event.preventDefault()"' : ''}>
        <i data-lucide="wallet"></i><span class="label">Load funds</span>
      </a>
      <a class="card-action ${isTerminated ? "disabled" : ""}" href="#" onclick="event.preventDefault(); alert(' (Limit increase) — coming later');">
        <i data-lucide="sliders"></i><span class="label">Limits</span>
      </a>
    </div>
  `;

  // Card meta panel
  document.getElementById("meta-mount").innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">Card details</span>
        <span class="panel-meta">Persisted in Cards service</span>
      </div>
      <div class="panel-body">
        <dl>
          <div><dt>Card ID</dt><dd class="mono">${card.id}</dd></div>
          <div><dt>Type</dt><dd>${card.type.charAt(0) + card.type.slice(1).toLowerCase()}</dd></div>
          <div><dt>Product</dt><dd>${card.product}</dd></div>
          <div><dt>Issuing bank</dt><dd>${card.bank} <span class="mono" style="color:var(--cs-ink-100);font-size:11px">(${card.bankCode})</span></dd></div>
          <div><dt>Created</dt><dd>${fmtTime(card.createdAt)}</dd></div>
          ${card.lastChangedAt ? `<div><dt>Last status change</dt><dd>${fmtTime(card.lastChangedAt)}</dd></div>` : ""}
        </dl>
      </div>
    </div>
  `;

  // Transactions snippet (placeholder for )
  const txns = mockTxns(card.id);
  document.getElementById("txns-mount").innerHTML = `
    <div class="panel-head" style="padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--cs-line)">
      <span class="panel-title">Recent activity</span>
      <a href="#" onclick="event.preventDefault(); alert(' (Full transactions list) — coming later');" class="cta-link" style="font-size:12px;font-weight:700;color:var(--cs-green-700)">View all → <span style="font-size:10px;color:var(--cs-ink-100);font-family:var(--font-mono);margin-left:4px"></span></a>
    </div>
    <div class="txn-snippet">
      ${txns.map(t => `
        <div class="txn-row">
          <div class="txn-icon ${t.type}">
            <i data-lucide="${t.type === "in" ? "arrow-down-left" : "arrow-up-right"}"></i>
          </div>
          <div class="txn-merchant">
            <div class="txn-name">${t.merchant}</div>
            <div class="txn-meta">${t.category}</div>
          </div>
          <div class="txn-amount ${t.type}">${fmtAmount(t.amount, b.currency)}</div>
        </div>
      `).join("")}
    </div>
  `;

  // Customer link
  document.getElementById("customer-link-mount").innerHTML = `
    <a href="../customers/profile.html?ref=${encodeURIComponent(card.owner.ref)}" class="btn btn-ghost btn-sm">
      <i data-lucide="user"></i> Open customer
    </a>
  `;

  if (window.lucide) lucide.createIcons();
}

function renderNotFound(cardId) {
  mountAppBar("Card not found");
  const main = document.querySelector(".scr-main .container") || document.querySelector(".scr-main");
  if (main) {
    main.innerHTML = `
      <div class="empty-list" style="margin-top:24px">
        <div class="empty-icon"><i data-lucide="credit-card"></i></div>
        <div class="empty-list-title">Card not found</div>
        <div class="empty-list-sub">
          ${cardId
            ? `No card in your tenant scope with reference <span class="mono" style="color:var(--cs-ink-700)">${cardId}</span>.`
            : "No card reference was provided."
          }
          <br/>Per -05, you only see cards in your authorised scope.
        </div>
        <a href="../customers/index.html" class="btn btn-primary"><i data-lucide="arrow-left"></i> Back to customers</a>
      </div>
    `;
  }
  if (window.lucide) lucide.createIcons();
}

// ─────────────────────────────────────────────────────────────
//  — Freeze card
// ─────────────────────────────────────────────────────────────
function initFreeze() {
  const cardId = getParam("cardId");
  if (!cardId) { renderNotFound(null); return; }
  const card = findCard(cardId);
  if (!card) { renderNotFound(cardId); return; }

  if (card.status !== "ACTIVE") {
    // 409 Conflict — already frozen / terminated
    document.getElementById("confirm-card-mount").innerHTML = `
      <div class="confirm-card">
        <div class="confirm-icon freeze"><i data-lucide="alert-triangle"></i></div>
        <div class="confirm-title">Cannot freeze this card</div>
        <div class="confirm-sub">
          Card status is <strong>${card.status}</strong>. Freeze is only valid from ACTIVE.
          ${card.status === "FROZEN" ? "<br/>It is already frozen — return to detail to unfreeze." : ""}
          <br/><span style="font-family:var(--font-mono);font-size:11px;color:var(--cs-ink-100)">409 Conflict per API-FRZ-01 error contract</span>
        </div>
        <div class="confirm-actions">
          <a href="index.html?cardId=${encodeURIComponent(card.id)}" class="btn btn-primary"><i data-lucide="arrow-left"></i> Back to card</a>
        </div>
      </div>
    `;
    mountAppBar("Freeze card", cardId);
    if (window.lucide) lucide.createIcons();
    return;
  }

  mountAppBar("Freeze card", cardId);

  document.getElementById("confirm-card-mount").innerHTML = `
    <div class="confirm-card">
      <div class="confirm-icon freeze"><i data-lucide="snowflake"></i></div>
      <div class="confirm-title">Freeze this card?</div>
      <div class="confirm-sub">
        Freezing prevents authorisations. The card holder cannot transact until you unfreeze it.
        Action is reversible.
      </div>

      <div class="confirm-card-mini">
        <div class="confirm-chip ${card.type === "PHYSICAL" ? "physical" : ""}"></div>
        <div class="confirm-card-info">
          <div class="confirm-card-pan">${card.maskedPan.replace(/\*/g, "•")}</div>
          <div class="confirm-card-meta">${card.product} · ${card.bank} · ${card.owner.fullName}</div>
        </div>
      </div>

      <div class="transition-arrow">
        <span class="transition-status active">ACTIVE</span>
        <span class="arr"><i data-lucide="arrow-right"></i></span>
        <span class="transition-status frozen">FROZEN</span>
      </div>

      <form id="freeze-form" autocomplete="off">
        <div class="field" style="margin-bottom:20px">
          <label for="reason" class="lbl" style="font-size:13px;font-weight:700;color:var(--cs-ink-700);margin-bottom:8px;display:block">
            Reason<span class="req">*</span>
          </label>
          <select id="reason" name="reason" required style="background:var(--cs-white);border:1px solid var(--cs-line-strong);border-radius:6px;padding:10px 13px;font-size:13.5px;width:100%">
            <option value="">Select a reason…</option>
            ${FREEZE_REASONS.map(r => `<option value="${r.value}">${r.label}</option>`).join("")}
          </select>
          <div class="help" style="font-size:11.5px;color:var(--cs-ink-100);margin-top:5px">Recorded in CardLifecycleEvent (-14) and AuditLog (-17).</div>
        </div>

        <div class="confirm-actions">
          <a href="index.html?cardId=${encodeURIComponent(card.id)}" class="btn btn-ghost"><i data-lucide="x"></i> Cancel</a>
          <button id="freeze-btn" type="submit" class="btn btn-primary" style="background:#1B547F"><i data-lucide="snowflake"></i> Freeze card</button>
        </div>
      </form>

      <div class="idem-key-strip">
        <strong>Request</strong> ${genReqId("REQ-FRZ")} · <strong>Idempotency</strong> ${genIdemKey("frz")}
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  document.getElementById("freeze-form").addEventListener("submit", e => {
    e.preventDefault();
    const reason = document.getElementById("reason").value;
    if (!reason) return;
    const btn = document.getElementById("freeze-btn");
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Calling CMS…`;
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      const cmsRef = genCmsRef("CMS-SRV");
      const changedAt = new Date().toISOString();
      // Per -11: update CardAccount.status to FROZEN
      setOverride(card.id, { status: "FROZEN", changedAt, cmsRef, reason });
      window.location.href = `index.html?cardId=${encodeURIComponent(card.id)}&just=froze`;
    }, 1100);
  });
}

// ─────────────────────────────────────────────────────────────
//  — Unfreeze card
// ─────────────────────────────────────────────────────────────
function initUnfreeze() {
  const cardId = getParam("cardId");
  if (!cardId) { renderNotFound(null); return; }
  const card = findCard(cardId);
  if (!card) { renderNotFound(cardId); return; }

  if (card.status !== "FROZEN") {
    document.getElementById("confirm-card-mount").innerHTML = `
      <div class="confirm-card">
        <div class="confirm-icon unfreeze"><i data-lucide="alert-triangle"></i></div>
        <div class="confirm-title">Cannot unfreeze this card</div>
        <div class="confirm-sub">
          Card status is <strong>${card.status}</strong>. Unfreeze is only valid from FROZEN.
          <br/><span style="font-family:var(--font-mono);font-size:11px;color:var(--cs-ink-100)">409 Conflict per API-UNF-01 error contract</span>
        </div>
        <div class="confirm-actions">
          <a href="index.html?cardId=${encodeURIComponent(card.id)}" class="btn btn-primary"><i data-lucide="arrow-left"></i> Back to card</a>
        </div>
      </div>
    `;
    mountAppBar("Unfreeze card", cardId);
    if (window.lucide) lucide.createIcons();
    return;
  }

  mountAppBar("Unfreeze card", cardId);

  document.getElementById("confirm-card-mount").innerHTML = `
    <div class="confirm-card">
      <div class="confirm-icon unfreeze"><i data-lucide="play"></i></div>
      <div class="confirm-title">Unfreeze this card?</div>
      <div class="confirm-sub">
        Unfreezing returns the card to ACTIVE. Authorisations resume immediately.
      </div>

      <div class="confirm-card-mini">
        <div class="confirm-chip frozen ${card.type === "PHYSICAL" ? "physical" : ""}"></div>
        <div class="confirm-card-info">
          <div class="confirm-card-pan">${card.maskedPan.replace(/\*/g, "•")}</div>
          <div class="confirm-card-meta">${card.product} · ${card.bank} · ${card.owner.fullName}</div>
        </div>
      </div>

      <div class="transition-arrow">
        <span class="transition-status frozen">FROZEN</span>
        <span class="arr"><i data-lucide="arrow-right"></i></span>
        <span class="transition-status active">ACTIVE</span>
      </div>

      <form id="unfreeze-form" autocomplete="off">
        <div class="field" style="margin-bottom:20px">
          <label for="reason" class="lbl" style="font-size:13px;font-weight:700;color:var(--cs-ink-700);margin-bottom:8px;display:block">
            Reason<span class="req">*</span>
          </label>
          <select id="reason" name="reason" required style="background:var(--cs-white);border:1px solid var(--cs-line-strong);border-radius:6px;padding:10px 13px;font-size:13.5px;width:100%">
            <option value="">Select a reason…</option>
            ${UNFREEZE_REASONS.map(r => `<option value="${r.value}">${r.label}</option>`).join("")}
          </select>
          <div class="help" style="font-size:11.5px;color:var(--cs-ink-100);margin-top:5px">Recorded in CardLifecycleEvent (-14) and AuditLog.</div>
        </div>

        <div class="confirm-actions">
          <a href="index.html?cardId=${encodeURIComponent(card.id)}" class="btn btn-ghost"><i data-lucide="x"></i> Cancel</a>
          <button id="unfreeze-btn" type="submit" class="btn btn-primary"><i data-lucide="play"></i> Unfreeze card</button>
        </div>
      </form>

      <div class="idem-key-strip">
        <strong>Request</strong> ${genReqId("REQ-UNF")} · <strong>Idempotency</strong> ${genIdemKey("unf")}
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  document.getElementById("unfreeze-form").addEventListener("submit", e => {
    e.preventDefault();
    const reason = document.getElementById("reason").value;
    if (!reason) return;
    const btn = document.getElementById("unfreeze-btn");
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Calling CMS…`;
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      const cmsRef = genCmsRef("CMS-SRV");
      const changedAt = new Date().toISOString();
      setOverride(card.id, { status: "ACTIVE", changedAt, cmsRef, reason });
      window.location.href = `index.html?cardId=${encodeURIComponent(card.id)}&just=unfroze`;
    }, 1100);
  });
}
