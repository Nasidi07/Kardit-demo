/* UJR020 — Reports */

const REPORTS = [
  { id: "issuance",  icon: "credit-card",   name: "Card Issuance Report",       desc: "Issuance volumes by bank, product, and type. Virtual account provisioning success rate.",         format: "CSV / XLSX" },
  { id: "status",    icon: "shield",        name: "Card Status Report",         desc: "Snapshot of card statuses across the tenant — Active, Frozen, Terminated, Personalizing.",         format: "CSV / XLSX" },
  { id: "funding",   icon: "wallet",        name: "Funding Transactions Report", desc: "All FundingTransaction entries — final states only (FR-RPT-12). Excludes reversed loads.",        format: "CSV / XLSX" },
  { id: "unload",    icon: "arrow-down-circle", name: "Unload Transactions Report", desc: "All unload / transfer-out transactions completed within the date range.",                       format: "CSV / XLSX" },
  { id: "txns",      icon: "list",          name: "Card Transaction Report",    desc: "Card spend, authorisations, and reversals. Filter by status and amount range.",                   format: "CSV / XLSX" },
  { id: "mc",        icon: "users",         name: "Pending Maker–Checker Report", desc: "Open approvals waiting for a checker. Use to spot stuck items.",                                 format: "CSV / XLSX" },
  { id: "cms",       icon: "alert-circle",  name: "Failed CMS Requests Report", desc: "CMS calls that failed and the platform retry outcome. From CMSRequestLog.",                       format: "CSV / XLSX" },
  { id: "limits",    icon: "sliders",       name: "Limit Change Requests Report", desc: "All limit-increase requests with their approval/decision history.",                              format: "CSV / XLSX" },
];

const RANGES = [
  { v: "today",      l: "Today" },
  { v: "week",       l: "Last 7 days" },
  { v: "month",      l: "Last 30 days" },
  { v: "last_month", l: "Last month" },
  { v: "quarter",    l: "This quarter" },
  { v: "custom",     l: "Custom range…" },
];

function renderAppBar() {
  return `
    <header class="scr-app-bar">
      <a href="../index.html" class="logo-link" aria-label="Kardit home">
        <span class="logo-mark">Kard<span class="logo-mark__i">i</span>t</span>
      </a>
      <div class="vbar"></div>
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="../index.html">Dashboard</a>
        <i data-lucide="chevron-right"></i>
        <strong>Reports</strong>
      </nav>
      <div class="spacer"></div>
      <a href="../../contact.html" class="help-link"><i data-lucide="help-circle"></i> Help</a>
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

function initReports() {
  document.getElementById("appbar-mount").outerHTML = renderAppBar();
  const grid = document.getElementById("reports-grid");
  grid.innerHTML = REPORTS.map(r => `
    <div class="report-card" data-id="${r.id}">
      <div class="report-head">
        <div class="report-icon"><i data-lucide="${r.icon}"></i></div>
        <div>
          <div class="report-title">${r.name}</div>
          <div class="report-meta">${r.format}</div>
        </div>
      </div>
      <div class="report-desc">${r.desc}</div>
      <div class="report-controls">
        <select id="range-${r.id}">
          ${RANGES.map(rg => `<option value="${rg.v}">${rg.l}</option>`).join("")}
        </select>
      </div>
      <div class="report-actions">
        <button class="btn btn-secondary btn-sm" data-fmt="csv" data-report="${r.id}"><i data-lucide="file-text"></i> CSV</button>
        <button class="btn btn-primary btn-sm" data-fmt="xlsx" data-report="${r.id}"><i data-lucide="table"></i> XLSX</button>
      </div>
      <div class="report-status" id="status-${r.id}"></div>
    </div>
  `).join("");

  if (window.lucide) lucide.createIcons();

  document.querySelectorAll("button[data-report]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-report");
      const fmt = btn.getAttribute("data-fmt");
      const status = document.getElementById("status-" + id);
      const cardButtons = document.querySelectorAll(`button[data-report="${id}"]`);
      cardButtons.forEach(b => b.disabled = true);
      status.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Queued · job REQ-RPT-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      if (window.lucide) lucide.createIcons();

      // Simulate two-phase: queued (700ms) → ready (1.3s more)
      setTimeout(() => {
        status.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Generating ${fmt.toUpperCase()}…`;
        if (window.lucide) lucide.createIcons();
      }, 700);
      setTimeout(() => {
        status.className = "report-status success";
        status.innerHTML = `<i data-lucide="check-circle-2"></i> Ready · <a href="#" onclick="event.preventDefault(); alert('Streamed download — wired to /api/v1/reports/{jobId}/download');" style="color:var(--cs-green-700);font-weight:700;text-decoration:underline">download ${fmt.toUpperCase()}</a>`;
        cardButtons.forEach(b => b.disabled = false);
        if (window.lucide) lucide.createIcons();
      }, 2000);
    });
  });
}
