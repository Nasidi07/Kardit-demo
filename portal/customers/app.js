/* ─────────────────────────────────────────────────────────────
   Kardit Mini CMS — Customers module ( + )
   : Customer data capture (form → saved draft)
   : View customer (search list → profile)
   ───────────────────────────────────────────────────────────── */

// ─────────────────────────────────────────────────────────────
// Mock customer dataset (shared between search and profile)
// Seeded with realistic Nigerian customers. CUST-2026-00345 is
// the draft customer captured via  — keeps continuity.
// ─────────────────────────────────────────────────────────────

const CUSTOMERS = [
  {
    ref: "CUST-2026-00345",
    title: "Mrs", firstName: "Adaeze", middleName: "Ngozi", lastName: "Okafor",
    dob: "1991-08-14", gender: "Female", nationality: "Nigerian",
    phone: "+234 803 555 0142", phoneAlt: null, email: "adaeze.okafor@example.com",
    street: "14 Bourdillon Road, Ikoyi", lga: "Eti-Osa", state: "Lagos", country: "Nigeria", postcode: "101233",
    bvn: "22123456789", nin: "98765432101", idType: "passport", idNumber: "A12345678",
    kycLevel: "LEVEL_2", verifiedAt: null,
    status: "DRAFT", createdAt: "2026-05-11T09:42:00Z", capturedBy: "Adaeze O.",
    cards: [],
  },
  {
    ref: "CUST-2026-00344",
    title: "Mr", firstName: "Tunde", middleName: null, lastName: "Bakare",
    dob: "1985-03-22", gender: "Male", nationality: "Nigerian",
    phone: "+234 805 123 4567", phoneAlt: "+234 814 992 0188", email: "tunde.bakare@example.com",
    street: "27 Adeola Odeku Street, Victoria Island", lga: "Eti-Osa", state: "Lagos", country: "Nigeria", postcode: "101241",
    bvn: "22087654321", nin: null, idType: "drivers", idNumber: "LSD-2019-44192",
    kycLevel: "LEVEL_2", verifiedAt: "2026-05-10T15:00:00Z",
    status: "ACTIVE", createdAt: "2026-05-10T14:21:00Z", capturedBy: "Adaeze O.",
    cards: [
      { id: "CARD-2026-VRP01029", maskedPan: "5061 ** ** ** 4421", expiry: "10/29", product: "Verve Prepaid Standard", productCode: "PRD-PREPAID-001", bank: "Zenith Bank", bankCode: "BNK-ZEN-002", type: "VIRTUAL", status: "ACTIVE", createdAt: "2026-05-10T14:30:00Z" },
    ],
  },
  {
    ref: "CUST-2026-00343",
    title: "Mrs", firstName: "Chiamaka", middleName: "Adaobi", lastName: "Eze",
    dob: "1989-04-15", gender: "Female", nationality: "Nigerian",
    phone: "+234 813 222 8800", phoneAlt: null, email: "chiamaka.eze@example.com",
    street: "12 Bonny Camp Road, Apapa", lga: "Apapa", state: "Lagos", country: "Nigeria", postcode: "101001",
    bvn: "22045678901", nin: "11122233344", idType: "passport", idNumber: "B98765432",
    kycLevel: "LEVEL_3", verifiedAt: "2026-04-20T10:00:00Z",
    status: "ACTIVE", createdAt: "2026-05-09T11:15:00Z", capturedBy: "Folake A.",
    cards: [
      { id: "CARD-2026-VRP01028", maskedPan: "5061 ** ** ** 0091", expiry: "12/29", product: "Verve Prepaid Standard", productCode: "PRD-PREPAID-001", bank: "Zenith Bank", bankCode: "BNK-ZEN-002", type: "VIRTUAL", status: "ACTIVE", createdAt: "2026-05-09T11:25:00Z" },
      { id: "CARD-2026-VRP00984", maskedPan: "5061 ** ** ** 7732", expiry: "06/28", product: "Verve Prepaid Standard", productCode: "PRD-PREPAID-001", bank: "GTBank", bankCode: "BNK-GTB-001", type: "PHYSICAL", status: "ACTIVE", createdAt: "2026-04-15T09:30:00Z" },
    ],
  },
  {
    ref: "CUST-2026-00342",
    title: "Mr", firstName: "Olumide", middleName: null, lastName: "Adeyemi",
    dob: "1994-11-08", gender: "Male", nationality: "Nigerian",
    phone: "+234 802 944 2233", phoneAlt: null, email: null,
    street: "Plot 3, Lekki Phase 1", lga: "Eti-Osa", state: "Lagos", country: "Nigeria", postcode: "101245",
    bvn: "22019283746", nin: null, idType: null, idNumber: null,
    kycLevel: "LEVEL_1", verifiedAt: null,
    status: "DRAFT", createdAt: "2026-05-09T08:33:00Z", capturedBy: "Adaeze O.",
    cards: [],
  },
  {
    ref: "CUST-2026-00341",
    title: "Ms", firstName: "Ngozi", middleName: null, lastName: "Anyanwu",
    dob: "1992-07-30", gender: "Female", nationality: "Nigerian",
    phone: "+234 818 110 3344", phoneAlt: null, email: "ngozi.anyanwu@example.com",
    street: "5 Aminu Kano Crescent, Wuse 2", lga: "Abuja Municipal", state: "FC", country: "Nigeria", postcode: "900288",
    bvn: "22056781234", nin: "55566677788", idType: "voters", idNumber: "VC-1029384",
    kycLevel: "LEVEL_2", verifiedAt: "2026-05-08T16:00:00Z",
    status: "ACTIVE", createdAt: "2026-05-08T15:21:00Z", capturedBy: "Folake A.",
    cards: [
      { id: "CARD-2026-VRP00973", maskedPan: "5061 ** ** ** 5566", expiry: "08/29", product: "Verve Prepaid Standard", productCode: "PRD-PREPAID-001", bank: "Access Bank", bankCode: "BNK-ACC-003", type: "VIRTUAL", status: "ACTIVE", createdAt: "2026-05-08T15:30:00Z" },
    ],
  },
  {
    ref: "CUST-2026-00340",
    title: "Mr", firstName: "Emeka", middleName: "Chukwuemeka", lastName: "Nwosu",
    dob: "1983-12-02", gender: "Male", nationality: "Nigerian",
    phone: "+234 803 887 1122", phoneAlt: null, email: "emeka.nwosu@example.com",
    street: "18 Asa Afariogun, Ajao Estate", lga: "Oshodi-Isolo", state: "Lagos", country: "Nigeria", postcode: "100263",
    bvn: "22099887766", nin: "44455566677", idType: "passport", idNumber: "A99887766",
    kycLevel: "LEVEL_3", verifiedAt: "2026-03-10T12:00:00Z",
    status: "ACTIVE", createdAt: "2026-05-06T10:18:00Z", capturedBy: "Adaeze O.",
    cards: [
      { id: "CARD-2026-VRP00921", maskedPan: "5061 ** ** ** 1142", expiry: "05/29", product: "Verve Prepaid Standard", productCode: "PRD-PREPAID-001", bank: "Zenith Bank", bankCode: "BNK-ZEN-002", type: "VIRTUAL", status: "ACTIVE", createdAt: "2026-05-06T10:30:00Z" },
    ],
  },
  {
    ref: "CUST-2026-00339",
    title: "Mrs", firstName: "Folake", middleName: null, lastName: "Adesanya",
    dob: "1987-06-19", gender: "Female", nationality: "Nigerian",
    phone: "+234 806 442 9912", phoneAlt: null, email: "folake.adesanya@example.com",
    street: "44 Allen Avenue, Ikeja", lga: "Ikeja", state: "Lagos", country: "Nigeria", postcode: "100271",
    bvn: "22033445566", nin: "77788899900", idType: "drivers", idNumber: "LSD-2018-99812",
    kycLevel: "LEVEL_2", verifiedAt: "2026-05-04T14:00:00Z",
    status: "FROZEN", createdAt: "2026-05-04T13:42:00Z", capturedBy: "Folake A.",
    cards: [
      { id: "CARD-2026-VRP00874", maskedPan: "5061 ** ** ** 9912", expiry: "04/29", product: "Verve Prepaid Standard", productCode: "PRD-PREPAID-001", bank: "GTBank", bankCode: "BNK-GTB-001", type: "VIRTUAL", status: "FROZEN", createdAt: "2026-05-04T13:50:00Z" },
    ],
  },
  {
    ref: "CUST-2026-00338",
    title: "Mr", firstName: "Babatunde", middleName: null, lastName: "Ojo",
    dob: "1990-02-25", gender: "Male", nationality: "Nigerian",
    phone: "+234 815 003 7788", phoneAlt: null, email: "babatunde.ojo@example.com",
    street: "9 Marina Road, Lagos Island", lga: "Lagos Island", state: "Lagos", country: "Nigeria", postcode: "101231",
    bvn: "22011223344", nin: "33344455566", idType: "voters", idNumber: "VC-9988776",
    kycLevel: "LEVEL_2", verifiedAt: "2026-05-03T11:00:00Z",
    status: "ACTIVE", createdAt: "2026-05-03T10:42:00Z", capturedBy: "Adaeze O.",
    cards: [
      { id: "CARD-2026-VRP00812", maskedPan: "5061 ** ** ** 7788", expiry: "03/29", product: "Verve Prepaid Standard", productCode: "PRD-PREPAID-001", bank: "Access Bank", bankCode: "BNK-ACC-003", type: "VIRTUAL", status: "ACTIVE", createdAt: "2026-05-03T11:00:00Z" },
    ],
  },
];

function findCustomer(ref) { return CUSTOMERS.find(c => c.ref === ref) || null; }
function customerFullName(c) { return [c.firstName, c.middleName, c.lastName].filter(Boolean).join(" "); }
function customerInitials(c) { return (c.firstName?.[0] || "") + (c.lastName?.[0] || ""); }
function maskBvn(b) { return b ? b.slice(0, 3) + "******" + b.slice(-2) : "—"; }
function formatDate(iso, opts) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", opts || { day: "2-digit", month: "short", year: "numeric" });
}
function relativeTime(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + " min ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + " hr ago";
  const d = Math.floor(h / 24);
  if (d < 7) return d + " day" + (d > 1 ? "s" : "") + " ago";
  return formatDate(iso);
}
function idTypeLabel(t) {
  return ({ passport: "International Passport", drivers: "Driver's License", voters: "Voter's Card" })[t] || t;
}

// ─────────────────────────────────────────────────────────────
// Shared chrome renderers
// ─────────────────────────────────────────────────────────────

function renderAppBar(crumbs) {
  const parts = crumbs.map((c, i) => {
    const isLast = i === crumbs.length - 1;
    const sep = i > 0 ? `<i data-lucide="chevron-right"></i>` : "";
    if (isLast || !c.href) return `${sep}<strong>${c.label}</strong>`;
    return `${sep}<a href="${c.href}">${c.label}</a>`;
  }).join("");
  return `
    <header class="scr-app-bar">
      <a href="../index.html" class="logo-link" aria-label="Kardit home">
        <span class="logo-mark">Kard<span class="logo-mark__i">i</span>t</span>
      </a>
      <div class="vbar"></div>
      <nav class="crumbs" aria-label="Breadcrumb">${parts}</nav>
      <div class="spacer"></div>
      <a href="../../contact.html" class="help-link">
        <i data-lucide="help-circle"></i> Help
      </a>
      <div class="user">
        <div class="avatar">AO</div>
        <div class="user-meta">
          <div class="user-name">Adaeze O.</div>
          <div class="user-org"><a href="../../signin.html" class="signout-link">Sign out</a></div>
        </div>
      </div>
    </header>
  `;
}

function renderHStepper(steps, activeStep) {
  return `
    <nav class="hstepper" aria-label="Flow steps">
      ${steps.map(s => {
        const isActive = s.num === activeStep;
        const isDone = s.num < activeStep;
        const cls = ["hstep", isActive && "is-active", isDone && "is-done"].filter(Boolean).join(" ");
        const circle = isDone ? `<i data-lucide="check"></i>` : s.num;
        return `<a class="${cls}" href="${s.href}"><span class="hstep__circle">${circle}</span><span>${s.label}</span></a>`;
      }).join("")}
    </nav>
  `;
}

function mountAppBar(crumbs) {
  const m = document.getElementById("appbar-mount");
  if (m) m.outerHTML = renderAppBar(crumbs);
}
function mountHStepper(steps, activeStep) {
  const m = document.getElementById("hstepper-mount");
  if (m) m.outerHTML = renderHStepper(steps, activeStep);
}
function refreshIcons() { if (window.lucide) lucide.createIcons(); }

// ─────────────────────────────────────────────────────────────
//  — New customer (form + saved)
// ─────────────────────────────────────────────────────────────

const NEW_CUSTOMER_STEPS = [
  { num: 1, id: "form",  label: "Customer details", href: "01-form.html" },
  { num: 2, id: "saved", label: "Saved",            href: "02-saved.html" },
];

function initFormPage(activeStep) {
  const cur = NEW_CUSTOMER_STEPS[activeStep - 1];
  mountAppBar([
    { label: "Dashboard", href: "../index.html" },
    { label: "Customers", href: "index.html" },
    { label: "New customer", href: "01-form.html" },
    { label: cur.label },
  ]);
  mountHStepper(NEW_CUSTOMER_STEPS, activeStep);
  refreshIcons();
}

function initForm() {
  const form = document.getElementById("customer-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = document.getElementById("save-draft");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Saving draft…`;
      refreshIcons();
    }
    setTimeout(() => { window.location.href = "02-saved.html"; }, 700);
  });
}

function initSaved() {
  const copyBtn = document.getElementById("copy-id");
  if (!copyBtn) return;
  copyBtn.addEventListener("click", () => {
    const id = document.getElementById("saved-cust-id")?.textContent?.trim();
    if (!id) return;
    navigator.clipboard?.writeText(id);
    const icon = copyBtn.querySelector("i");
    if (icon) {
      const original = icon.getAttribute("data-lucide");
      icon.setAttribute("data-lucide", "check");
      refreshIcons();
      setTimeout(() => {
        const refresh = copyBtn.querySelector("i");
        if (refresh) {
          refresh.setAttribute("data-lucide", original || "copy");
          refreshIcons();
        }
      }, 1200);
    }
  });
}

// Backwards-compat alias — older HTML calls initPage(N)
function initPage(activeStep) { initFormPage(activeStep); }

// ─────────────────────────────────────────────────────────────
//  — Customer search ()
// ─────────────────────────────────────────────────────────────

const searchState = { query: "", kyc: "all", status: "all" };

function statusBadge(s) { return `<span class="badge status-${s.toLowerCase()}">${s}</span>`; }
function kycBadge(level) {
  const n = (level || "").replace("LEVEL_", "");
  return `<span class="kyc-pill lvl-${n}">Tier ${n}</span>`;
}

function initSearchPage() {
  mountAppBar([
    { label: "Dashboard", href: "../index.html" },
    { label: "Customers" },
  ]);
  refreshIcons();
  initSearch();
}

function filteredCustomers() {
  const q = searchState.query.trim().toLowerCase();
  return CUSTOMERS.filter(c => {
    if (searchState.kyc !== "all" && c.kycLevel !== searchState.kyc) return false;
    if (searchState.status !== "all" && c.status !== searchState.status) return false;
    if (!q) return true;
    const hay = [c.ref, customerFullName(c), c.phone, c.email || "", c.bvn || "", c.nin || ""].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

function renderCustomerRow(c) {
  const name = customerFullName(c);
  return `
    <tr data-ref="${c.ref}">
      <td class="id">${c.ref}</td>
      <td>
        <div class="name">
          <div class="avatar-sm">${customerInitials(c)}</div>
          <div>
            <div style="font-weight:600;color:var(--cs-ink-700)">${name}</div>
            <div style="font-size:11.5px;color:var(--cs-ink-100)">${c.email || c.phone}</div>
          </div>
        </div>
      </td>
      <td class="mono" style="font-size:12px;color:var(--cs-ink-200)">${c.phone}</td>
      <td>${kycBadge(c.kycLevel)}</td>
      <td>${statusBadge(c.status)}</td>
      <td class="kyc-cell">${c.cards.length}</td>
      <td class="meta">${relativeTime(c.createdAt)}</td>
      <td class="right">
        <a href="profile.html?ref=${encodeURIComponent(c.ref)}" class="icon-button" aria-label="View profile">
          <i data-lucide="chevron-right"></i>
        </a>
      </td>
    </tr>
  `;
}

function renderResults() {
  const tbody = document.getElementById("customers-tbody");
  const meta  = document.getElementById("result-meta");
  if (!tbody) return;
  const list = filteredCustomers();
  if (meta) meta.innerHTML = `Showing <strong>${list.length}</strong> of <strong>${CUSTOMERS.length}</strong> customers`;
  if (list.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="empty-list">
          <i data-lucide="search-x"></i>
          <div class="empty-list-title">No customers match those filters</div>
          <div class="empty-list-sub">Try changing or clearing the filters above.<br/>Search runs against name, phone, ref, BVN, and NIN.</div>
          <button class="btn btn-secondary" onclick="clearFilters()"><i data-lucide="x"></i> Clear filters</button>
        </div>
      </td></tr>
    `;
  } else {
    tbody.innerHTML = list.map(renderCustomerRow).join("");
  }
  refreshIcons();
  tbody.querySelectorAll("tr[data-ref]").forEach(tr => {
    tr.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      window.location.href = `profile.html?ref=${encodeURIComponent(tr.getAttribute("data-ref"))}`;
    });
  });
}

function clearFilters() {
  searchState.query = "";
  searchState.kyc = "all";
  searchState.status = "all";
  const input = document.getElementById("customer-search");
  if (input) input.value = "";
  document.querySelectorAll(".filter-chip[data-filter]").forEach(chip => {
    chip.classList.toggle("is-active", chip.getAttribute("data-value") === "all");
  });
  renderResults();
}

function initSearch() {
  const input = document.getElementById("customer-search");
  if (input) {
    input.addEventListener("input", e => { searchState.query = e.target.value; renderResults(); });
    input.focus();
  }
  document.querySelectorAll(".filter-chip[data-filter]").forEach(chip => {
    chip.addEventListener("click", () => {
      const filter = chip.getAttribute("data-filter");
      const value  = chip.getAttribute("data-value");
      document.querySelectorAll(`.filter-chip[data-filter="${filter}"]`).forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      searchState[filter] = value;
      renderResults();
    });
  });
  renderResults();
}

// ─────────────────────────────────────────────────────────────
//  — Customer profile ()
// ─────────────────────────────────────────────────────────────

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function initProfilePage() {
  const ref = getQueryParam("ref");
  const c   = ref ? findCustomer(ref) : null;
  if (!c) {
    mountAppBar([
      { label: "Dashboard", href: "../index.html" },
      { label: "Customers", href: "index.html" },
      { label: "Not found" },
    ]);
    renderProfileNotFound(ref);
    refreshIcons();
    return;
  }
  mountAppBar([
    { label: "Dashboard", href: "../index.html" },
    { label: "Customers", href: "index.html" },
    { label: customerFullName(c) },
  ]);
  renderProfile(c);
  refreshIcons();
}

function renderProfile(c) {
  const mount = document.getElementById("profile-mount");
  if (!mount) return;
  const fullName = customerFullName(c);
  const cardCount = c.cards.length;

  const identityRows = `
    <div><dt>Title</dt><dd>${c.title || "—"}</dd></div>
    <div><dt>Full name</dt><dd>${fullName}</dd></div>
    <div><dt>Date of birth</dt><dd>${formatDate(c.dob)}</dd></div>
    <div><dt>Gender</dt><dd>${c.gender || "—"}</dd></div>
    <div><dt>Nationality</dt><dd>${c.nationality || "—"}</dd></div>
    <div><dt>Mobile</dt><dd class="mono">${c.phone}</dd></div>
    ${c.phoneAlt ? `<div><dt>Alt. mobile</dt><dd class="mono">${c.phoneAlt}</dd></div>` : ""}
    <div><dt>Email</dt><dd>${c.email || '<span class="muted">not provided</span>'}</dd></div>
    <div><dt>Address</dt><dd style="text-align:right">${c.street}<br/>${c.lga}, ${c.state}, ${c.country}${c.postcode ? " · " + c.postcode : ""}</dd></div>
  `;

  const kycRows = `
    <div><dt>KYC level</dt><dd>${kycBadge(c.kycLevel)}</dd></div>
    <div><dt>BVN</dt><dd class="mono">${maskBvn(c.bvn)}</dd></div>
    <div><dt>NIN</dt><dd class="mono">${c.nin ? maskBvn(c.nin) : '<span class="muted">not provided</span>'}</dd></div>
    <div><dt>Secondary ID</dt><dd>${c.idType ? `${idTypeLabel(c.idType)} · <span class="mono" style="font-size:11.5px">${c.idNumber}</span>` : '<span class="muted">not provided</span>'}</dd></div>
    <div><dt>Verified at</dt><dd>${c.verifiedAt ? formatDate(c.verifiedAt) : '<span class="muted">pending</span>'}</dd></div>
    <div><dt>Captured by</dt><dd>${c.capturedBy}</dd></div>
    <div><dt>Created</dt><dd>${formatDate(c.createdAt)}</dd></div>
  `;

  const cardsBody = cardCount === 0
    ? `<div class="cards-empty">No cards linked to this customer yet. <a href="../issue-card/01-start.html?customerId=${encodeURIComponent(c.ref)}" class="cta-link">Issue the first card →</a></div>`
    : c.cards.map(renderCardRow).join("");

  mount.innerHTML = `
    <section class="profile-hero">
      <div class="profile-avatar">${customerInitials(c)}</div>
      <div class="profile-meta">
        <div class="profile-name">${fullName}</div>
        <div class="profile-meta-row">
          <span class="profile-ref">${c.ref}</span>
          ${statusBadge(c.status)}
          ${kycBadge(c.kycLevel)}
          <span>Captured ${relativeTime(c.createdAt)}</span>
        </div>
      </div>
      <div class="profile-actions">
        <a href="#" class="btn btn-secondary btn-sm" onclick="event.preventDefault(); alert('Edit profile — not in  scope ( owns capture).');">
          <i data-lucide="edit-2"></i> Edit
        </a>
        <a href="../issue-card/01-start.html?customerId=${encodeURIComponent(c.ref)}" class="btn btn-primary">
          <i data-lucide="credit-card"></i> Issue new card
        </a>
      </div>
    </section>

    <div class="profile-two-col">
      <div class="panel-card">
        <div class="panel-head"><div class="panel-title">Identity</div></div>
        <div class="panel-body"><dl class="profile-specs">${identityRows}</dl></div>
      </div>
      <div class="panel-card">
        <div class="panel-head"><div class="panel-title">KYC details</div></div>
        <div class="panel-body"><dl class="profile-specs">${kycRows}</dl></div>
      </div>
    </div>

    <div class="cards-list-card">
      <div class="cards-list-head">
        <div>
          <span class="cards-list-title">Cards</span>
          <span class="cards-list-count">${cardCount} linked</span>
        </div>
        ${cardCount > 0 ? `<a href="../issue-card/01-start.html?customerId=${encodeURIComponent(c.ref)}" class="btn btn-secondary btn-sm"><i data-lucide="plus"></i> Issue card</a>` : ''}
      </div>
      <div class="cards-list-body">${cardsBody}</div>
    </div>
  `;
}

function renderCardRow(card) {
  const thumbCls = card.status === "FROZEN" ? "frozen" : (card.type === "PHYSICAL" ? "physical" : "");
  return `
    <div class="card-row">
      <div class="card-thumb ${thumbCls}">VERVE</div>
      <div class="card-body">
        <div class="card-head-row">
          <span class="card-id">${card.id}</span>
          ${statusBadge(card.status)}
          <span class="kyc-pill lvl-${card.type === "VIRTUAL" ? "2" : "3"}">${card.type}</span>
        </div>
        <div class="card-product">${card.product} · ${card.bank}</div>
        <div class="card-meta">
          <span class="card-pan">${card.maskedPan}</span> · exp ${card.expiry} · ${card.bankCode} · created ${formatDate(card.createdAt)}
        </div>
      </div>
      <div class="card-actions">
        <a href="../card/index.html?cardId=${encodeURIComponent(card.id)}" class="btn btn-ghost btn-sm"><i data-lucide="wallet"></i> Balance</a>
        <a href="#" class="btn btn-ghost btn-sm" onclick="event.preventDefault(); alert(' (Transactions) — coming later.');"><i data-lucide="list"></i> Txns</a>
        ${card.status === "ACTIVE"
          ? `<a href="../card/freeze.html?cardId=${encodeURIComponent(card.id)}" class="btn btn-ghost btn-sm"><i data-lucide="snowflake"></i> Freeze</a>`
          : card.status === "FROZEN"
            ? `<a href="../card/unfreeze.html?cardId=${encodeURIComponent(card.id)}" class="btn btn-ghost btn-sm"><i data-lucide="sun"></i> Unfreeze</a>`
            : ""
        }
      </div>
    </div>
  `;
}

function renderProfileNotFound(ref) {
  const mount = document.getElementById("profile-mount");
  if (!mount) return;
  mount.innerHTML = `
    <div class="empty-list" style="background:var(--cs-white);border:1px solid var(--cs-line);border-radius:var(--cs-radius-lg);">
      <i data-lucide="user-x"></i>
      <div class="empty-list-title">Customer not found</div>
      <div class="empty-list-sub">
        ${ref ? `No customer in your tenant scope with reference <span class="mono" style="color:var(--cs-ink-700)">${ref}</span>.` : "No customer reference was provided."}<br/>
        It may belong to a different tenant or have been removed. Per -08, you only see customers in your scope.
      </div>
      <a href="index.html" class="btn btn-primary"><i data-lucide="arrow-left"></i> Back to customers</a>
    </div>
  `;
}

