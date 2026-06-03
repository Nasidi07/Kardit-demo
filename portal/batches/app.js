/* ─────────────────────────────────────────────────────────────
   Kardit Mini CMS — UJR006 Batch Onboarding
   Shared shell renderer matching the Affiliate Portal pattern
   used in flows/affiliate_onboarding/. Each screen-specific HTML
   calls initPage(stepNumber).
   ───────────────────────────────────────────────────────────── */

const STEPS = [
  { num: 1, id: "browse",    label: "Browse batches",     meta: "View existing jobs and history",     actor: "Maker",   href: "01-dashboard.html"  },
  { num: 2, id: "upload",    label: "Upload batch file",  meta: "CSV or XLSX with customer rows",     actor: "Maker",   href: "02-upload.html"     },
  { num: 3, id: "validate",  label: "Validation",         meta: "Review rows, fix or skip errors",    actor: "Maker",   href: "03-validation.html" },
  { num: 4, id: "submit",    label: "Submit",             meta: "Send to checker for approval",       actor: "Maker",   href: "04-submit.html"     },
  { num: 5, id: "approve",   label: "Approval",           meta: "Checker review and sign-off",        actor: "Checker", href: "05-approval.html"   },
  { num: 6, id: "process",   label: "Processing",         meta: "Customer + card creation in CMS",    actor: "Maker",   href: "06-processing.html" },
  { num: 7, id: "results",   label: "Results",            meta: "Outcomes, retries, downloads",       actor: "Maker",   href: "07-result.html"     },
];

// ─────────────────────────────────────────────────────────────
// Top App Bar — matches flows/affiliate_onboarding/shell.jsx AppBar
// ─────────────────────────────────────────────────────────────

function renderAppBar(activeStep) {
  const cur = STEPS[activeStep - 1];
  return `
    <header class="scr-app-bar">
      <a href="../index.html" class="logo-link" aria-label="Kardit home">
        <span class="logo-mark">Kard<span class="logo-mark__i">i</span>t</span>
      </a>
      <div class="vbar"></div>
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="01-dashboard.html">Batch Issuance</a>
        <i data-lucide="chevron-right"></i>
        <strong>${cur.label}</strong>
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

// ─────────────────────────────────────────────────────────────
// Horizontal stepper — sits between AppBar and main content on
// step pages. Compact version of the welcome-page big stepper.
// ─────────────────────────────────────────────────────────────

function renderHStepper(activeStep) {
  return `
    <nav class="hstepper" aria-label="Batch issuance flow">
      ${STEPS.map(s => {
        const isActive = s.num === activeStep;
        const isDone = s.num < activeStep;
        const cls = ["hstep", isActive && "is-active", isDone && "is-done"].filter(Boolean).join(" ");
        const circleContents = isDone ? `<i data-lucide="check"></i>` : s.num;
        const actorCls = s.actor === "Checker" ? "checker" : "";
        return `
          <a class="${cls}" href="${s.href}">
            <span class="hstep__circle">${circleContents}</span>
            <span>${s.label}</span>
            <span class="hstep__actor ${actorCls}">${s.actor}</span>
          </a>
        `;
      }).join("")}
    </nav>
  `;
}

// ─────────────────────────────────────────────────────────────
// Big stepper — used on the welcome page
// ─────────────────────────────────────────────────────────────

function renderBigStepper(activeStep) {
  return `
    <nav class="big-stepper" aria-label="Batch issuance journey">
      ${STEPS.map(s => {
        const isActive = s.num === activeStep;
        const isDone = s.num < activeStep;
        const cls = ["big-step", isActive && "is-active", isDone && "is-done"].filter(Boolean).join(" ");
        const circleContents = isDone ? `<i data-lucide="check"></i>` : s.num;
        return `
          <a class="${cls}" href="${s.href}">
            <span class="big-step__circle">${circleContents}</span>
            <span class="big-step__label">${s.label}</span>
          </a>
        `;
      }).join("")}
    </nav>
  `;
}

// ─────────────────────────────────────────────────────────────
// Mount the chrome on every page
// ─────────────────────────────────────────────────────────────

function initPage(activeStep) {
  const appbarMount = document.getElementById("appbar-mount");
  if (appbarMount) appbarMount.outerHTML = renderAppBar(activeStep);

  const hstepperMount = document.getElementById("hstepper-mount");
  if (hstepperMount) hstepperMount.outerHTML = renderHStepper(activeStep);

  const bigStepperMount = document.getElementById("big-stepper-mount");
  if (bigStepperMount) bigStepperMount.outerHTML = renderBigStepper(activeStep);

  if (window.lucide) lucide.createIcons();
}

// ─────────────────────────────────────────────────────────────
// Per-screen interactions
// ─────────────────────────────────────────────────────────────

// Upload screen — file picker behavior
function initUpload() {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const submitBtn = document.getElementById("upload-submit");
  if (!dropzone || !fileInput) return;

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dropzone.classList.add("has-file");
    dropzone.innerHTML = `
      <div class="file-pill">
        <div class="file-icon"><i data-lucide="file-text"></i></div>
        <div class="file-meta">
          <div class="file-name">${file.name}</div>
          <div class="file-detail">${(file.size / 1024).toFixed(1)} KB · ready to upload</div>
        </div>
        <button class="icon-button" type="button" onclick="resetDropzone(event)" aria-label="Remove file">
          <i data-lucide="x"></i>
        </button>
      </div>
    `;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.pointerEvents = "auto";
    }
    if (window.lucide) lucide.createIcons();
  });
}

function resetDropzone(evt) {
  evt.preventDefault();
  evt.stopPropagation();
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const submitBtn = document.getElementById("upload-submit");
  if (!dropzone) return;
  dropzone.classList.remove("has-file");
  dropzone.innerHTML = `
    <div class="dropzone-prompt">
      <i data-lucide="upload"></i>
      <div class="dropzone-prompt-main">Drop CSV or XLSX here, or click to browse</div>
      <div class="dropzone-prompt-sub">Up to 10,000 rows · 25 MB max · file structure must match the template</div>
    </div>
  `;
  if (fileInput) fileInput.value = "";
  if (submitBtn) {
    submitBtn.style.opacity = "0.4";
    submitBtn.style.pointerEvents = "none";
  }
  if (window.lucide) lucide.createIcons();
}

// Approval queue — selecting a batch
function initApproval() {
  const items = document.querySelectorAll(".queue-item");
  items.forEach(item => {
    item.addEventListener("click", () => {
      items.forEach(i => i.classList.remove("selected"));
      item.classList.add("selected");
    });
  });
}

// Processing screen — simulate progress
function initProcessing() {
  const fillEl = document.getElementById("progress-fill");
  const numEl = document.getElementById("progress-num");
  const pctEl = document.getElementById("progress-pct");
  const remainEl = document.getElementById("progress-remaining");
  if (!fillEl) return;

  let processed = 226;
  const total = 239;

  setInterval(() => {
    if (processed >= total - 5) return;
    processed += 1;
    const pct = ((processed / total) * 100).toFixed(1);
    fillEl.style.width = pct + "%";
    if (numEl) numEl.textContent = processed.toLocaleString();
    if (pctEl) pctEl.textContent = pct + "%";
    if (remainEl) remainEl.textContent = (total - processed).toLocaleString();
  }, 800);
}
