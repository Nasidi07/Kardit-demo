/* ─────────────────────────────────────────────────────────────
   Kardit Mini CMS — UJR012 Load funds (maker-checker)
   ───────────────────────────────────────────────────────────── */

const LOADABLE_CARDS = [
  { id: "CARD-2026-VRP01029", maskedPan: "5061 ** ** ** 4421", expiry: "10/29", product: "Verve Prepaid Standard", bank: "Zenith Bank", customer: "Tunde Bakare", customerRef: "CUST-2026-00344" },
  { id: "CARD-2026-VRP01028", maskedPan: "5061 ** ** ** 0091", expiry: "12/29", product: "Verve Prepaid Standard", bank: "Zenith Bank", customer: "Chiamaka Eze", customerRef: "CUST-2026-00343" },
  { id: "CARD-2026-VRP00984", maskedPan: "5061 ** ** ** 7732", expiry: "06/28", product: "Verve Prepaid Standard", bank: "GTBank", customer: "Chiamaka Eze", customerRef: "CUST-2026-00343" },
  { id: "CARD-2026-VRP00973", maskedPan: "5061 ** ** ** 5566", expiry: "08/29", product: "Verve Prepaid Standard", bank: "Access Bank", customer: "Ngozi Anyanwu", customerRef: "CUST-2026-00341" },
];

const FUND_PROOF_TYPES = [
  { value: "BANK_TRANSFER_CONFIRMED", label: "Bank transfer confirmed", sub: "Customer transferred to VA · transfer reference required" },
  { value: "INTERNAL_FUND_MOVE",      label: "Internal fund move",       sub: "Affiliate-pool to VA · internal reference required" },
  { value: "VA_DIRECT_CREDIT",        label: "Virtual account credit",  sub: "Direct credit into VA from issuing bank" },
];

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

const STATE_KEY = "kardit_load_state_v1";

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
function findLoadCard(id) { return LOADABLE_CARDS.find(c => c.id === id) || null; }

function fmtNaira(n) {
  return "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtTime(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function genReqId()  { return "REQ-LOAD-" + String(40 + Math.floor(Math.random() * 999)).padStart(5, "0"); }
function genIdem()   { return "idem-load-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36); }
function genTxnId()  { return "TXN-LOAD-" + String(7821 + Math.floor(Math.random() * 9999)).padStart(7, "0"); }

// ───── Chrome ─────
function renderAppBar(currentLabel) {
  return `
    <header class="scr-app-bar">
      <a href="../index.html" class="logo-link" aria-label="Kardit home">
        <span class="logo-mark">Kard<span class="logo-mark__i">i</span>t</span>
      </a>
      <div class="vbar"></div>
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="../index.html">Dashboard</a>
        <i data-lucide="chevron-right"></i>
        <a href="01-form.html">Funds</a>
        <i data-lucide="chevron-right"></i>
        <strong>${currentLabel}</strong>
      </nav>
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
function mountAppBar(label) {
  const m = document.getElementById("appbar-mount");
  if (m) m.outerHTML = renderAppBar(label);
}

function renderStepper(active) {
  const steps = [
    { n: 1, label: "Form" },
    { n: 2, label: "Review" },
    { n: 3, label: "Result" },
  ];
  return `
    <nav class="hstepper" aria-label="Load funds flow">
      ${steps.map(s => {
        const isActive = s.n === active;
        const isDone = s.n < active;
        const cls = ["hstep", isActive && "is-active", isDone && "is-done"].filter(Boolean).join(" ");
        const circle = isDone ? `<i data-lucide="check"></i>` : s.n;
        return `<a class="${cls}" href="#" onclick="event.preventDefault()"><span class="hstep__circle">${circle}</span><span>${s.label}</span></a>`;
      }).join("")}
    </nav>
  `;
}
function mountStepper(active) {
  const m = document.getElementById("hstepper-mount");
  if (m) m.outerHTML = renderStepper(active);
}

// ───── 01-form.html ─────
function initForm() {
  mountAppBar("Load funds");
  mountStepper(1);

  const cardIdParam = getParam("cardId");
  let card = cardIdParam ? findLoadCard(cardIdParam) : null;
  // If warm-start with valid card, save and continue
  if (card) setState({ card });

  const cardMount = document.getElementById("card-mount");
  const formMount = document.getElementById("form-mount");

  if (!card) {
    // Cold start — render card picker
    cardMount.innerHTML = `
      <section class="card card-pad-lg" style="margin-bottom:18px">
        <div class="form-section-head"><h2 class="form-section-title">Choose a card</h2><span class="form-section-meta">Funds will be loaded to its linked virtual account</span></div>
        <div class="card-pick-grid">
          ${LOADABLE_CARDS.map(c => `
            <a href="01-form.html?cardId=${encodeURIComponent(c.id)}" class="card-pick-tile">
              <div class="thumb"></div>
              <div class="info">
                <div class="pan">${c.maskedPan.replace(/\*/g, "•")}</div>
                <div class="meta">${c.customer} · ${c.bank}</div>
              </div>
            </a>
          `).join("")}
        </div>
      </section>
    `;
    formMount.style.display = "none";
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Render selected card mini display
  cardMount.innerHTML = `
    <section class="card card-pad-lg" style="margin-bottom:18px;display:flex;align-items:center;gap:16px">
      <div style="width:60px;height:40px;border-radius:6px;background:linear-gradient(135deg,#156A38,#0F4F2E);position:relative;flex-shrink:0">
        <div style="position:absolute;top:8px;left:7px;width:18px;height:14px;border-radius:2px;background:linear-gradient(140deg,#F5DA94,#C09642)"></div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-family:var(--font-mono);font-size:13.5px;color:var(--cs-ink-700);font-weight:600">${card.maskedPan.replace(/\*/g, "•")}</div>
        <div style="font-size:11.5px;color:var(--cs-ink-100);margin-top:3px">${card.product} · ${card.bank} · ${card.customer}</div>
      </div>
      <a href="01-form.html" style="font-size:12px;font-weight:700;color:var(--cs-green-700);text-decoration:none">Change card →</a>
    </section>
  `;

  // Form
  formMount.innerHTML = `
    <div class="maker-checker-banner">
      <div class="icn"><i data-lucide="shield-check"></i></div>
      <div>
        <div class="title">Maker-checker required</div>
        <div class="body">As a maker, your load request is submitted for checker approval per FR-LOAD-MC-01. The funds are not credited until the checker approves. You cannot approve your own request.</div>
      </div>
    </div>

    <form id="load-form" class="card card-pad-lg" autocomplete="off">
      <section class="form-section">
        <div class="form-section-head"><h2 class="form-section-title">Amount</h2><span class="form-section-meta">In NGN</span></div>
        <div class="amount-input-wrap">
          <span class="currency">₦</span>
          <input id="amount" name="amount" type="number" inputmode="decimal" step="0.01" min="100" required placeholder="0.00">
        </div>
        <div class="amount-chips">
          ${QUICK_AMOUNTS.map(a => `<button type="button" class="amount-chip" data-quick="${a}">${fmtNaira(a)}</button>`).join("")}
        </div>
      </section>

      <section class="form-section">
        <div class="form-section-head"><h2 class="form-section-title">Funding reference</h2><span class="form-section-meta">FR-LOAD-API-01-07/08 — VA must already be funded</span></div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
          ${FUND_PROOF_TYPES.map((s, i) => `
            <label class="radio-pill" style="padding:14px 18px;justify-content:flex-start;align-items:flex-start;flex-direction:column;gap:4px;align-items:flex-start">
              <div style="display:flex;align-items:center;gap:10px;width:100%">
                <input type="radio" name="proofType" value="${s.value}" ${i === 0 ? "checked" : ""}>
                <span class="dot"></span>
                <span style="font-weight:700;color:var(--cs-ink-900);font-size:13.5px">${s.label}</span>
              </div>
              <div style="font-size:11.5px;color:var(--cs-ink-100);padding-left:30px">${s.sub}</div>
            </label>
          `).join("")}
        </div>
        <div class="form-grid">
          <div class="field is-mono">
            <label for="vaNumber">Linked virtual account number<span class="req">*</span></label>
            <input id="vaNumber" name="vaNumber" type="text" required inputmode="numeric" pattern="[0-9]{10}" maxlength="10" placeholder="1234567890" value="1234567890">
            <div class="help">10-digit NUBAN of the VA linked to this card</div>
          </div>
          <div class="field is-mono">
            <label for="transferRef">Bank transfer reference<span class="req">*</span></label>
            <input id="transferRef" name="transferRef" type="text" required maxlength="32" placeholder="TRF-2026-009811">
            <div class="help">Reference printed on the bank transfer receipt</div>
          </div>
        </div>
      </section>

      <section class="form-section">
        <div class="form-section-head"><h2 class="form-section-title">Reference</h2><span class="form-section-meta">Optional — appears in audit log</span></div>
        <div class="field">
          <input id="reference" name="reference" type="text" maxlength="64" placeholder="e.g. Salary advance — March">
        </div>
      </section>

      <div class="form-foot">
        <a href="../index.html" class="btn btn-ghost btn-sm"><i data-lucide="x"></i> Cancel</a>
        <button type="submit" class="btn btn-primary">Continue to review <i data-lucide="arrow-right"></i></button>
      </div>
    </form>
  `;

  if (window.lucide) lucide.createIcons();

  // Quick amount chips
  document.querySelectorAll(".amount-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".amount-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const v = chip.getAttribute("data-quick");
      document.getElementById("amount").value = v;
    });
  });

  // Submit
  document.getElementById("load-form").addEventListener("submit", e => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("amount").value);
    const proofType = document.querySelector('input[name="proofType"]:checked')?.value;
    const vaNumber = document.getElementById("vaNumber").value.trim();
    const transferRef = document.getElementById("transferRef").value.trim();
    const reference = document.getElementById("reference").value.trim() || null;
    if (!amount || !proofType || !vaNumber || !transferRef) return;
    setState({
      card, amount, reference,
      fundingReference: {
        virtualAccountNumber: vaNumber,
        bankId: card.bank === "Zenith Bank" ? "BNK-ZEN-002" : (card.bank === "GTBank" ? "BNK-GTB-001" : "BNK-ACC-005"),
        bankTransferReference: transferRef,
        proofType,
      },
    });
    window.location.href = "02-review.html";
  });
}

// ───── 02-review.html ─────
function initReview() {
  mountAppBar("Review load");
  mountStepper(2);

  const state = getState();
  if (!state.card || !state.amount || !state.fundingReference) { window.location.href = "01-form.html"; return; }

  const c = state.card;
  const fr = state.fundingReference;
  const proofLabel = FUND_PROOF_TYPES.find(p => p.value === fr.proofType)?.label || fr.proofType;
  const idem = state.idem || genIdem();
  const reqId = state.reqId || genReqId();
  setState({ idem, reqId });

  document.getElementById("review-mount").innerHTML = `
    <div class="maker-checker-banner">
      <div class="icn"><i data-lucide="users"></i></div>
      <div>
        <div class="title">Approval required from a checker</div>
        <div class="body">On submit, this load enters the pending approval queue. The CMS load only fires after the checker approves AND the VA funding is validated against the bank-transfer reference (FR-LOAD-API-01-08).</div>
      </div>
    </div>

    <div class="review-grid">
      <div class="review-panel">
        <div class="review-head">
          <span class="review-title">Card</span>
          <a href="01-form.html" class="review-edit"><i data-lucide="edit-2"></i> Edit</a>
        </div>
        <div class="review-body">
          <dl class="profile-specs">
            <div><dt>Card ID</dt><dd class="mono">${c.id}</dd></div>
            <div><dt>Masked PAN</dt><dd class="mono">${c.maskedPan.replace(/\*/g, "•")}</dd></div>
            <div><dt>Cardholder</dt><dd>${c.customer}</dd></div>
            <div><dt>Bank · Product</dt><dd>${c.bank} · ${c.product}</dd></div>
          </dl>
        </div>
      </div>

      <div class="review-panel">
        <div class="review-head">
          <span class="review-title">Load</span>
          <a href="01-form.html" class="review-edit"><i data-lucide="edit-2"></i> Edit</a>
        </div>
        <div class="review-body">
          <div style="font-family:var(--font-display);font-size:32px;font-weight:800;color:var(--cs-ink-900);margin-bottom:14px;letter-spacing:-0.02em">
            ${fmtNaira(state.amount)}
            <span style="font-size:14px;color:var(--cs-ink-100);font-weight:600;margin-left:6px">NGN</span>
          </div>
          <dl class="profile-specs">
            <div><dt>Reference</dt><dd>${state.reference || '<span class="muted">none</span>'}</dd></div>
            <div><dt>Settlement</dt><dd>Immediate on approval + VA validation</dd></div>
          </dl>
        </div>
      </div>

      <div class="review-panel wide">
        <div class="review-head">
          <span class="review-title">Funding reference · API-LOAD-01</span>
          <a href="01-form.html" class="review-edit"><i data-lucide="edit-2"></i> Edit</a>
        </div>
        <div class="review-body">
          <dl class="profile-specs">
            <div><dt>Proof type</dt><dd>${proofLabel}</dd></div>
            <div><dt>Virtual account number</dt><dd class="mono">${fr.virtualAccountNumber}</dd></div>
            <div><dt>Issuing bank</dt><dd class="mono">${fr.bankId}</dd></div>
            <div><dt>Bank transfer reference</dt><dd class="mono">${fr.bankTransferReference}</dd></div>
          </dl>
        </div>
      </div>
    </div>

    <div class="idempotency-strip" style="margin-top:18px">
      <i data-lucide="shield-check"></i>
      <div>Request <span class="key">${reqId}</span> · Idempotency <span class="key">${idem}</span> — same key replayed returns the same outcome (FR-LOAD-API-01-21).</div>
    </div>

    <div class="form-foot" style="margin-top:24px">
      <a href="01-form.html" class="btn btn-ghost btn-sm"><i data-lucide="arrow-left"></i> Back</a>
      <button id="submit-btn" class="btn btn-primary btn-lg"><i data-lucide="send"></i> Submit for approval</button>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  document.getElementById("submit-btn").addEventListener("click", () => {
    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Submitting…`;
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
      // Simulate maker-checker: auto-approved by "Folake A." (a different user)
      const outcome = {
        txnId: genTxnId(),
        approvedBy: "Folake A.",
        approvedAt: new Date().toISOString(),
        cmsRef: "CMS-FUND-" + String(881000 + Math.floor(Math.random() * 9999)).padStart(7, "0"),
        balance: 50000 + state.amount, // simplified — real balance would come from CMS
      };
      setState({ outcome });
      window.location.href = "03-result.html";
    }, 1400);
  });
}

// ───── 03-result.html ─────
function initResult() {
  mountAppBar("Funds loaded");
  mountStepper(3);

  const state = getState();
  if (!state.outcome) { window.location.href = "01-form.html"; return; }

  const c = state.card;
  const o = state.outcome;
  const fr = state.fundingReference || {};
  const proofLabel = FUND_PROOF_TYPES.find(p => p.value === fr.proofType)?.label || fr.proofType || "—";

  document.getElementById("result-mount").innerHTML = `
    <div class="result-card" style="text-align:left;padding:32px">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
        <div style="width:56px;height:56px;border-radius:50%;background:var(--cs-green-100);border:1.5px solid var(--cs-green-300);color:var(--cs-green-700);display:grid;place-items:center;flex-shrink:0">
          <i data-lucide="check" style="width:28px;height:28px"></i>
        </div>
        <div>
          <div style="font-family:var(--font-display);font-size:22px;font-weight:800;color:var(--cs-ink-900);letter-spacing:-0.02em">Funds loaded</div>
          <div style="font-size:13px;color:var(--cs-ink-200);margin-top:3px">Approved by ${o.approvedBy} · CMS confirmed · linked VA credited</div>
        </div>
      </div>

      <div style="background:var(--cs-paper);border:1px solid var(--cs-line);border-radius:var(--cs-radius-md);padding:24px;margin-bottom:18px;text-align:center">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:var(--cs-ink-100);font-weight:700;margin-bottom:8px">Amount loaded</div>
        <div class="funded-amount">${fmtNaira(state.amount).replace("₦", "")}<span class="cur">NGN</span></div>
        <div style="font-size:12px;color:var(--cs-ink-200);margin-top:10px">Posted to ${c.maskedPan.replace(/\*/g, "•")} · ${c.customer}</div>
        <div style="font-size:12px;color:var(--cs-ink-200);margin-top:4px">New ledger balance: <strong style="color:var(--cs-ink-700);font-family:var(--font-mono)">${fmtNaira(o.balance)}</strong></div>
      </div>

      <dl class="profile-specs">
        <div><dt>Funding transaction ID</dt><dd class="mono">${o.txnId}</dd></div>
        <div><dt>CMS reference</dt><dd class="mono">${o.cmsRef}</dd></div>
        <div><dt>Virtual account</dt><dd class="mono">${fr.virtualAccountNumber || "—"}</dd></div>
        <div><dt>Bank transfer ref</dt><dd class="mono">${fr.bankTransferReference || "—"}</dd></div>
        <div><dt>Proof type</dt><dd>${proofLabel}</dd></div>
        <div><dt>Internal reference</dt><dd>${state.reference || '<span class="muted">—</span>'}</dd></div>
        <div><dt>Approved at</dt><dd>${fmtTime(o.approvedAt)}</dd></div>
      </dl>

      <div class="audit-trail">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:var(--cs-ink-100);font-weight:700;margin-bottom:10px">Maker-checker audit trail</div>
        <div class="audit-step">
          <div class="av maker">AO</div>
          <div class="info">
            <div class="who">Adaeze O. <span style="color:var(--cs-ink-100);font-weight:400">submitted load request</span></div>
            <div class="what">As maker · request ${state.reqId} · idempotency ${state.idem.slice(0, 20)}…</div>
          </div>
        </div>
        <div class="audit-step">
          <div class="av">FA</div>
          <div class="info">
            <div class="who">Folake A. <span style="color:var(--cs-ink-100);font-weight:400">approved as checker</span></div>
            <div class="what">CMS load fired · VA credited · CardBalanceSnapshot updated</div>
          </div>
        </div>
      </div>

      <div class="result-actions" style="margin-top:28px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="01-form.html?cardId=${encodeURIComponent(c.id)}" class="btn btn-secondary" onclick="sessionStorage.removeItem('${STATE_KEY}')">
          <i data-lucide="plus"></i> Load another
        </a>
        <a href="../card/index.html?cardId=${encodeURIComponent(c.id)}" class="btn btn-primary">
          <i data-lucide="credit-card"></i> View card balance
        </a>
        <a href="../index.html" class="btn btn-ghost">Back to dashboard</a>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}
