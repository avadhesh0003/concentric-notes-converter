// Concentric Notes Converter V2.3 (Modern UI Edition)
// Created by Avadhesh Pingoriya
// Step-by-Step Wizard with full backward/forward navigation + untouched V1.2 Smart Ink Saver

let backendAvailable = false;
const VERCEL_SAFE_BYTES = 4 * 1024 * 1024;

window.addEventListener("DOMContentLoaded", async () => {
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  try {
    const res = await fetch("/api/health", { method: "GET" });
    if (res.ok) backendAvailable = true;
  } catch (_) {
    backendAvailable = false;
  }
});

// ==================== THEME & ABOUT DIALOG ====================
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const html = document.documentElement;
    const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
    html.setAttribute("data-theme", next);
  });
}

const aboutModal = document.getElementById("aboutModal");
if (aboutModal) {
  const openBtn = document.getElementById("openAboutBtn");
  const openSide = document.getElementById("openAboutSidebar");
  const closeBtn = document.getElementById("closeAboutBtn");
  if (openBtn) openBtn.onclick = () => (aboutModal.hidden = false);
  if (openSide) openSide.onclick = () => (aboutModal.hidden = false);
  if (closeBtn) closeBtn.onclick = () => (aboutModal.hidden = true);
  aboutModal.addEventListener("click", e => {
    if (e.target === aboutModal) aboutModal.hidden = true;
  });
}

// ==================== TOOL SWITCHER ====================
function switchTool(tool, title) {
  document.querySelectorAll(".tool-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.tool === tool);
  });
  document.querySelectorAll(".tool-panel").forEach(p => {
    p.classList.toggle("active", p.id === tool + "Tool");
  });
  const crumb = document.getElementById("crumb");
  if (crumb) crumb.textContent = title || "Process Notes";
}

document.querySelectorAll(".tool-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    switchTool(tab.dataset.tool, tab.dataset.title);
  });
});

const brandHome = document.getElementById("brandHomeLink");
if (brandHome) {
  brandHome.addEventListener("click", e => {
    e.preventDefault();
    switchTool("notes", "Process Notes — Smart Ink Saver");
  });
}

const openInfoTopBtn = document.getElementById("openInfoTopBtn");
if (openInfoTopBtn) {
  openInfoTopBtn.addEventListener("click", () => {
    switchTool("info", "Info, How It Works & Precautions");
  });
}

// ==================== GENERIC STEP-BY-STEP WIZARD HELPER ====================
function setWizardStep(toolPrefix, stepNum, maxUnlockedStep, onEnterStep) {
  const panel = document.getElementById(toolPrefix + "Tool");
  if (!panel) return;

  panel.querySelectorAll(".wizard-step").forEach(s => {
    s.classList.toggle("active", Number(s.dataset.step) === stepNum);
  });

  panel.querySelectorAll(".step-pill").forEach(pill => {
    const pStep = Number(pill.dataset.step);
    pill.disabled = pStep > maxUnlockedStep;
    pill.classList.toggle("active", pStep === stepNum);
    pill.classList.toggle("done", pStep < stepNum && pStep <= maxUnlockedStep);
  });

  if (typeof onEnterStep === "function") onEnterStep(stepNum);
}

// ==================== SHARED UTILITIES ====================
function parsePageSpec(spec, total) {
  if (!spec || !spec.trim()) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set();
  spec.replace(/\s+/g, "").split(",").forEach(part => {
    if (!part) return;
    if (part.includes("-")) {
      let [a, b] = part.split("-", 2).map(Number);
      if (!isNaN(a) && !isNaN(b)) {
        if (a > b) [a, b] = [b, a];
        for (let p = Math.max(1, a); p <= Math.min(total, b); p++) pages.add(p);
      }
    } else {
      const p = Number(part);
      if (!isNaN(p) && p >= 1 && p <= total) pages.add(p);
    }
  });
  return [...pages].sort((a, b) => a - b);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ==================== EXACT V1.2 SMART INK SAVER PORT (JS CANVAS) ====================
function isDarkSlideJS(gray, w, h) {
  const band = Math.max(1, Math.floor(Math.min(h, w) / 18));
  let borderSum = 0;
  let borderCount = 0;

  for (let y = 0; y < band; y++) {
    const rowTop = y * w;
    const rowBot = (h - 1 - y) * w;
    for (let x = 0; x < w; x++) {
      borderSum += gray[rowTop + x] + gray[rowBot + x];
      borderCount += 2;
    }
  }
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < band; x++) {
      borderSum += gray[row + x] + gray[row + (w - 1 - x)];
      borderCount += 2;
    }
  }
  let totalSum = 0;
  const totalPixels = w * h;
  for (let i = 0; i < totalPixels; i++) totalSum += gray[i];

  return (borderSum / borderCount) < 135 || (totalSum / totalPixels) < 115;
}

function applyCLAHE(gray, w, h, clipLimit = 1.25, tilesX = 8, tilesY = 8) {
  const tileW = Math.ceil(w / tilesX);
  const tileH = Math.ceil(h / tilesY);
  const luts = new Uint8Array(tilesX * tilesY * 256);

  for (let ty = 0; ty < tilesY; ty++) {
    const y0 = ty * tileH;
    const y1 = Math.min(h, y0 + tileH);
    for (let tx = 0; tx < tilesX; tx++) {
      const x0 = tx * tileW;
      const x1 = Math.min(w, x0 + tileW);
      const area = Math.max(1, (x1 - x0) * (y1 - y0));
      const limit = Math.max(1, Math.floor((clipLimit * area) / 256));

      const hist = new Int32Array(256);
      for (let y = y0; y < y1; y++) {
        const row = y * w;
        for (let x = x0; x < x1; x++) hist[gray[row + x]]++;
      }

      let excess = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > limit) {
          excess += hist[i] - limit;
          hist[i] = limit;
        }
      }
      const redist = Math.floor(excess / 256);
      const rem = excess % 256;
      for (let i = 0; i < 256; i++) {
        hist[i] += redist + (i < rem ? 1 : 0);
      }

      const lutOffset = (ty * tilesX + tx) * 256;
      let cdf = 0;
      const scale = 255 / area;
      for (let i = 0; i < 256; i++) {
        cdf += hist[i];
        luts[lutOffset + i] = Math.min(255, Math.round(cdf * scale));
      }
    }
  }

  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = (y + 0.5) / tileH - 0.5;
    const ty0 = Math.max(0, Math.min(tilesY - 1, Math.floor(fy)));
    const ty1 = Math.min(tilesY - 1, ty0 + 1);
    const wy = Math.max(0, Math.min(1, fy - ty0));

    for (let x = 0; x < w; x++) {
      const fx = (x + 0.5) / tileW - 0.5;
      const tx0 = Math.max(0, Math.min(tilesX - 1, Math.floor(fx)));
      const tx1 = Math.min(tilesX - 1, tx0 + 1);
      const wx = Math.max(0, Math.min(1, fx - tx0));

      const v = gray[y * w + x];
      const v00 = luts[(ty0 * tilesX + tx0) * 256 + v];
      const v10 = luts[(ty0 * tilesX + tx1) * 256 + v];
      const v01 = luts[(ty1 * tilesX + tx0) * 256 + v];
      const v11 = luts[(ty1 * tilesX + tx1) * 256 + v];

      const top = v00 * (1 - wx) + v10 * wx;
      const bot = v01 * (1 - wx) + v11 * wx;
      out[y * w + x] = Math.round(top * (1 - wy) + bot * wy);
    }
  }
  return out;
}

function gaussianBlur3x3(src, w, h) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const ym = Math.max(0, y - 1) * w;
    const yc = y * w;
    const yp = Math.min(h - 1, y + 1) * w;
    for (let x = 0; x < w; x++) {
      const xm = Math.max(0, x - 1);
      const xp = Math.min(w - 1, x + 1);
      const sum =
        src[ym + xm] + (src[ym + x] << 1) + src[ym + xp] +
        (src[yc + xm] << 1) + (src[yc + x] << 2) + (src[yc + xp] << 1) +
        src[yp + xm] + (src[yp + x] << 1) + src[yp + xp];
      out[yc + x] = (sum + 8) >> 4;
    }
  }
  return out;
}

function adaptiveThresholdV4(smooth, w, h, strength) {
  let cValue = Math.round(20 - strength * 0.127);
  cValue = Math.max(6, Math.min(20, cValue));

  const radius = 20;
  const sigma = 6.5;
  const kernel = new Float32Array(41);
  let kSum = 0;
  for (let i = -radius; i <= radius; i++) {
    const wgt = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + radius] = wgt;
    kSum += wgt;
  }
  for (let i = 0; i < 41; i++) kernel[i] /= kSum;

  const temp = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) {
        const xx = Math.max(0, Math.min(w - 1, x + k));
        acc += smooth[row + xx] * kernel[k + radius];
      }
      temp[row + x] = acc;
    }
  }

  const result = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) {
        const yy = Math.max(0, Math.min(h - 1, y + k));
        acc += temp[yy * w + x] * kernel[k + radius];
      }
      const thresh = acc - cValue;
      result[row + x] = smooth[row + x] > thresh ? 255 : 0;
    }
  }
  return result;
}

function removeIsolatedNoise8CC(result, w, h) {
  const minArea = Math.max(3, Math.floor(w * h * 0.000002));
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  const component = [];

  for (let i = 0; i < w * h; i++) {
    if (result[i] === 0 && !visited[i]) {
      visited[i] = 1;
      let head = 0, tail = 0;
      queue[tail++] = i;
      component.length = 0;

      while (head < tail) {
        const curr = queue[head++];
        component.push(curr);
        const cy = Math.floor(curr / w);
        const cx = curr - cy * w;

        for (let dy = -1; dy <= 1; dy++) {
          const ny = cy + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            if (nx < 0 || nx >= w) continue;
            const ni = ny * w + nx;
            if (result[ni] === 0 && !visited[ni]) {
              visited[ni] = 1;
              queue[tail++] = ni;
            }
          }
        }
      }

      if (component.length < minArea) {
        for (let j = 0; j < component.length; j++) {
          result[component[j]] = 255;
        }
      }
    }
  }
  return result;
}

function processCanvasInPlace(canvas, mode, strength = 55) {
  if (mode === "original") return canvas;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const gray = new Uint8Array(w * h);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  let outGray = gray;
  if (mode === "invert_bw") {
    outGray = new Uint8Array(w * h);
    for (let p = 0; p < gray.length; p++) {
      const inv = 255 - gray[p];
      outGray[p] = inv > 150 ? 255 : 0;
    }
  } else if (mode === "smart") {
    if (isDarkSlideJS(gray, w, h)) {
      for (let p = 0; p < gray.length; p++) gray[p] = 255 - gray[p];
    }
    const enhanced = applyCLAHE(gray, w, h, 1.25, 8, 8);
    const smooth = gaussianBlur3x3(enhanced, w, h);
    const binary = adaptiveThresholdV4(smooth, w, h, strength);
    outGray = removeIsolatedNoise8CC(binary, w, h);
  }

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const v = outGray[p];
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

async function generateThumbnailsClient(file, scale = 0.34) {
  const buf = await file.arrayBuffer();
  const pdfDoc = await window.pdfjsLib.getDocument({ data: buf }).promise;
  const thumbs = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(vp.width));
    canvas.height = Math.max(1, Math.floor(vp.height));
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    thumbs.push({
      page: i,
      image: canvas.toDataURL("image/jpeg", 0.68)
    });
  }
  return { pages: pdfDoc.numPages, thumbs };
}

async function getPreviewData(file) {
  if (backendAvailable && file.size <= VERCEL_SAFE_BYTES) {
    try {
      const fd = new FormData();
      fd.append("pdf", file);
      const r = await fetch("/preview", { method: "POST", body: fd });
      if (r.ok) return await r.json();
    } catch (_) {}
  }
  return await generateThumbnailsClient(file);
}

// ==================== TOOL 1: PROCESS NOTES (4-STEP WIZARD) ====================
const pdfInput = document.getElementById("pdf");
const thumbsContainer = document.getElementById("thumbnails");
const fileInfo = document.getElementById("fileInfo");
const pageInfo = document.getElementById("pageInfo");
const pagesInput = document.getElementById("pages");
const form = document.getElementById("form");
const strengthSlider = document.getElementById("strength");
const strengthValue = document.getElementById("strengthValue");

const notesBackBtn = document.getElementById("notesBackBtn");
const notesNextBtn = document.getElementById("notesNextBtn");
const notesGenerateBtn = document.getElementById("notesGenerateBtn");
const notesFooterStatus = document.getElementById("notesFooterStatus");
const notesLoadedBanner = document.getElementById("notesLoadedBanner");
const notesLoadedName = document.getElementById("notesLoadedName");
const notesContinueStep2Btn = document.getElementById("notesContinueStep2Btn");

const firstPagePreviewImg = document.getElementById("firstPagePreviewImg");
const firstPageMeta = document.getElementById("firstPageMeta");
const refreshPreviewBtn = document.getElementById("refreshPreviewBtn");

let notesStep = 1;
let notesMaxUnlocked = 1;
let selectedSlides = new Set();
let totalNotesSlides = 0;

strengthSlider.addEventListener("input", () => {
  strengthValue.textContent = strengthSlider.value;
});

function syncNotesWizardFooter() {
  notesBackBtn.disabled = notesStep === 1;
  if (notesStep === 1) {
    notesNextBtn.style.display = "inline-flex";
    notesGenerateBtn.style.display = "none";
    notesNextBtn.disabled = totalNotesSlides === 0;
    notesNextBtn.textContent = "Next: Select Slides →";
    notesFooterStatus.textContent = totalNotesSlides
      ? `${totalNotesSlides} pages loaded. Click Next to choose slides.`
      : "Step 1 of 4 · Upload a lecture PDF to begin";
  } else if (notesStep === 2) {
    notesNextBtn.style.display = "inline-flex";
    notesGenerateBtn.style.display = "none";
    notesNextBtn.disabled = selectedSlides.size === 0;
    notesNextBtn.textContent = "Next: Settings →";
    notesFooterStatus.textContent = `Step 2 of 4 · ${selectedSlides.size} of ${totalNotesSlides} slide${selectedSlides.size === 1 ? "" : "s"} selected`;
  } else if (notesStep === 3) {
    notesNextBtn.style.display = "inline-flex";
    notesGenerateBtn.style.display = "none";
    notesNextBtn.disabled = false;
    notesNextBtn.textContent = "Next: Preview 1st Page →";
    notesFooterStatus.textContent = `Step 3 of 4 · ${selectedSlides.size} slides selected · Configure layout & ink`;
  } else if (notesStep === 4) {
    notesNextBtn.style.display = "none";
    notesGenerateBtn.style.display = "inline-flex";
    notesFooterStatus.textContent = `Step 4 of 4 · Inspect 1st A4 sheet preview or go back to adjust`;
  }
}

function goNotesStep(targetStep) {
  if (targetStep < 1 || targetStep > notesMaxUnlocked) return;
  if (targetStep >= 3 && selectedSlides.size === 0) {
    notesFooterStatus.textContent = "Please select at least 1 slide before continuing.";
    return;
  }
  notesStep = targetStep;
  setWizardStep("notes", notesStep, notesMaxUnlocked, step => {
    syncNotesWizardFooter();
    if (step === 4) {
      triggerFirstPagePreview();
    }
  });
}

// Stepper pill clicks for Notes
document.querySelectorAll("#notesTool .step-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    const s = Number(pill.dataset.step);
    if (s <= notesMaxUnlocked) goNotesStep(s);
  });
});

notesBackBtn.addEventListener("click", () => {
  if (notesStep > 1) goNotesStep(notesStep - 1);
});

notesNextBtn.addEventListener("click", () => {
  if (notesStep === 1 && totalNotesSlides > 0) {
    notesMaxUnlocked = Math.max(notesMaxUnlocked, 2);
    goNotesStep(2);
  } else if (notesStep === 2 && selectedSlides.size > 0) {
    notesMaxUnlocked = Math.max(notesMaxUnlocked, 3);
    goNotesStep(3);
  } else if (notesStep === 3) {
    notesMaxUnlocked = Math.max(notesMaxUnlocked, 4);
    goNotesStep(4);
  }
});

if (notesContinueStep2Btn) {
  notesContinueStep2Btn.addEventListener("click", () => goNotesStep(2));
}

function updateNotesStatsChips() {
  const checkedLayout = document.querySelector('input[name="slides_per_page"]:checked');
  const perSheet = checkedLayout ? Number(checkedLayout.value) : 3;
  const estSheets = selectedSlides.size ? Math.ceil(selectedSlides.size / perSheet) : 0;
  const chipSel = document.getElementById("chipSelectedCount");
  const chipSheets = document.getElementById("chipEstSheets");
  const chipStep3Summary = document.getElementById("chipStep3Summary");
  if (chipSel) chipSel.innerHTML = `Selected: <strong>${selectedSlides.size} / ${totalNotesSlides} slides</strong>`;
  if (chipSheets) chipSheets.innerHTML = `Estimated Output: <strong>${estSheets} A4 sheet${estSheets === 1 ? "" : "s"}</strong> (${perSheet} per page)`;
  if (chipStep3Summary) chipStep3Summary.innerHTML = `<strong>${selectedSlides.size} slides</strong> → <strong>${estSheets} A4 page${estSheets === 1 ? "" : "s"}</strong>`;
}

document.querySelectorAll('input[name="slides_per_page"]').forEach(radio => {
  radio.addEventListener("change", updateNotesStatsChips);
});

function updateNotesSelectionUI() {
  thumbsContainer.querySelectorAll(".thumb").forEach(el => {
    const p = Number(el.dataset.page);
    const active = selectedSlides.has(p);
    el.classList.toggle("active", active);
    el.querySelector(".check").textContent = active ? "✓" : "";
  });
  pagesInput.value = [...selectedSlides].sort((a, b) => a - b).join(",");
  pageInfo.textContent = `${selectedSlides.size} of ${totalNotesSlides} slide${selectedSlides.size === 1 ? "" : "s"} selected`;
  updateNotesStatsChips();
  syncNotesWizardFooter();
}

pdfInput.addEventListener("change", async () => {
  const file = pdfInput.files[0];
  if (!file) return;
  fileInfo.textContent = `Loading ${file.name} (${formatFileSize(file.size)})…`;
  notesFooterStatus.textContent = "Generating slide thumbnails…";
  thumbsContainer.innerHTML = "";
  selectedSlides.clear();

  try {
    const d = await getPreviewData(file);
    totalNotesSlides = d.pages;
    d.thumbs.forEach(t => {
      selectedSlides.add(t.page);
      const el = document.createElement("div");
      el.className = "thumb active";
      el.dataset.page = t.page;
      el.innerHTML = `<div class="check">✓</div><img src="${t.image}" alt="Slide ${t.page}"><div class="num">Slide ${t.page}</div>`;
      el.onclick = () => {
        selectedSlides.has(t.page) ? selectedSlides.delete(t.page) : selectedSlides.add(t.page);
        updateNotesSelectionUI();
      };
      thumbsContainer.appendChild(el);
    });
    fileInfo.textContent = `${file.name} · ${formatFileSize(file.size)} (${totalNotesSlides} pages)`;
    if (notesLoadedBanner) {
      notesLoadedBanner.hidden = false;
      notesLoadedName.textContent = `${file.name} (${totalNotesSlides} slides)`;
    }
    notesMaxUnlocked = 4;
    updateNotesSelectionUI();
    goNotesStep(2);
  } catch (err) {
    fileInfo.textContent = "Error: " + err.message;
    notesFooterStatus.textContent = "Preview failed: " + err.message;
  }
});

const mainDropzone = document.getElementById("dropzone");
if (mainDropzone) {
  ["dragenter", "dragover"].forEach(ev => mainDropzone.addEventListener(ev, e => {
    e.preventDefault();
    mainDropzone.classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach(ev => mainDropzone.addEventListener(ev, e => {
    e.preventDefault();
    mainDropzone.classList.remove("dragging");
  }));
  mainDropzone.addEventListener("drop", e => {
    const f = [...e.dataTransfer.files].find(x => x.type === "application/pdf" || x.name.toLowerCase().endsWith(".pdf"));
    if (!f) return;
    const dt = new DataTransfer();
    dt.items.add(f);
    pdfInput.files = dt.files;
    pdfInput.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

document.getElementById("all").onclick = () => {
  for (let i = 1; i <= totalNotesSlides; i++) selectedSlides.add(i);
  updateNotesSelectionUI();
};
document.getElementById("none").onclick = () => {
  selectedSlides.clear();
  updateNotesSelectionUI();
};
document.getElementById("invertSel").onclick = () => {
  for (let i = 1; i <= totalNotesSlides; i++) {
    selectedSlides.has(i) ? selectedSlides.delete(i) : selectedSlides.add(i);
  }
  updateNotesSelectionUI();
};
document.getElementById("applyRangeBtn").onclick = () => {
  const spec = document.getElementById("rangeQuickInput").value;
  if (!totalNotesSlides) return;
  selectedSlides = new Set(parsePageSpec(spec, totalNotesSlides));
  updateNotesSelectionUI();
};

// ---------- RENDER ONLY THE 1ST OUTPUT A4 SHEET ----------
async function renderFirstSheetClientSide(file, formData) {
  const buf = await file.arrayBuffer();
  const pdfDoc = await window.pdfjsLib.getDocument({ data: buf }).promise;

  const slidesPerPage = Number(formData.get("slides_per_page") || 3);
  const mode = formData.get("mode") || "smart";
  const strength = Number(formData.get("strength") || 55);
  const orientation = formData.get("orientation") || "portrait";
  const marginPreset = formData.get("margin") || "normal";
  const drawBorder = formData.get("border") === "1";
  const pageNumbers = formData.get("page_numbers") === "1";
  const headerText = (formData.get("header_text") || "").trim();

  let [A4_W, A4_H] = orientation === "landscape" ? [842, 595] : [595, 842];
  const layouts = { 1: [1, 1], 2: [1, 2], 3: [1, 3], 4: [2, 2], 6: [2, 3], 8: [2, 4], 9: [3, 3] };
  let [cols, rows] = layouts[slidesPerPage] || [1, 3];
  if (orientation === "landscape" && [2, 3, 6].includes(slidesPerPage)) {
    [cols, rows] = [rows, cols];
  }

  const margin = marginPreset === "compact" ? 8 : (marginPreset === "wide" ? 24 : 14);
  const gap = marginPreset === "compact" ? 5 : (marginPreset === "wide" ? 10 : 7);
  const topExtra = headerText ? 16 : 0;
  const bottomExtra = pageNumbers ? 16 : 0;

  const cellW = (A4_W - 2 * margin - (cols - 1) * gap) / cols;
  const cellH = (A4_H - 2 * margin - topExtra - bottomExtra - (rows - 1) * gap) / rows;
  const perSheet = cols * rows;

  const sortedPages = [...selectedSlides].sort((a, b) => a - b);
  const totalSheets = Math.ceil(sortedPages.length / perSheet);
  const firstSheetPages = sortedPages.slice(0, perSheet);

  const scaleFactor = 1.5;
  const sheetCanvas = document.createElement("canvas");
  sheetCanvas.width = Math.round(A4_W * scaleFactor);
  sheetCanvas.height = Math.round(A4_H * scaleFactor);
  const ctx = sheetCanvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

  for (let idx = 0; idx < firstSheetPages.length; idx++) {
    const pageNum = firstSheetPages[idx];
    const srcPage = await pdfDoc.getPage(pageNum);
    const vp = srcPage.getViewport({ scale: 1.7 });
    const slideCanvas = document.createElement("canvas");
    slideCanvas.width = Math.floor(vp.width);
    slideCanvas.height = Math.floor(vp.height);
    await srcPage.render({ canvasContext: slideCanvas.getContext("2d"), viewport: vp }).promise;

    processCanvasInPlace(slideCanvas, mode, strength);

    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const x0 = margin + col * (cellW + gap);
    const y0 = margin + topExtra + row * (cellH + gap);

    const iw = slideCanvas.width;
    const ih = slideCanvas.height;
    const sc = Math.min(cellW / iw, cellH / ih);
    const dw = iw * sc;
    const dh = ih * sc;
    const x = (x0 + (cellW - dw) / 2) * scaleFactor;
    const y = (y0 + (cellH - dh) / 2) * scaleFactor;
    const rw = dw * scaleFactor;
    const rh = dh * scaleFactor;

    ctx.drawImage(slideCanvas, x, y, rw, rh);

    if (drawBorder) {
      ctx.strokeStyle = "#bfbfc7";
      ctx.lineWidth = 1.1;
      ctx.strokeRect(x, y, rw, rh);
    }
  }

  ctx.fillStyle = "#595966";
  ctx.font = `${Math.round(8.5 * scaleFactor)}px sans-serif`;
  if (headerText) {
    ctx.fillText(headerText, margin * scaleFactor, (margin + 9) * scaleFactor);
  }
  if (pageNumbers) {
    const label = `Page 1 of ${totalSheets}`;
    const tw = ctx.measureText(label).width;
    ctx.fillText(label, (sheetCanvas.width - tw) / 2, (A4_H - margin + 2) * scaleFactor);
  }

  return {
    preview_image: sheetCanvas.toDataURL("image/png"),
    total_sheets: totalSheets,
    slides_shown: firstSheetPages.length
  };
}

async function triggerFirstPagePreview() {
  const file = pdfInput.files[0];
  if (!file || !selectedSlides.size) return;

  if (refreshPreviewBtn) refreshPreviewBtn.disabled = true;
  firstPageMeta.textContent = "Rendering 1st A4 page preview with V1.2 Smart Ink Saver…";

  const fd = new FormData(form);
  try {
    let data;
    if (backendAvailable && file.size <= VERCEL_SAFE_BYTES) {
      const r = await fetch("/preview-sheet", { method: "POST", body: fd });
      if (!r.ok) throw new Error("Preview failed");
      data = await r.json();
    } else {
      data = await renderFirstSheetClientSide(file, fd);
    }
    firstPagePreviewImg.src = data.preview_image;
    firstPageMeta.textContent = `Page 1 of ${data.total_sheets} total A4 sheet${data.total_sheets === 1 ? "" : "s"} (${data.slides_shown} slide${data.slides_shown === 1 ? "" : "s"} on this sheet · ${selectedSlides.size} slides total)`;
  } catch (err) {
    firstPageMeta.textContent = "Preview error: " + err.message;
  } finally {
    if (refreshPreviewBtn) refreshPreviewBtn.disabled = false;
  }
}

if (refreshPreviewBtn) refreshPreviewBtn.onclick = triggerFirstPagePreview;

async function processNotesClientSide(file, formData) {
  const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
  const buf = await file.arrayBuffer();
  const pdfDoc = await window.pdfjsLib.getDocument({ data: buf }).promise;

  const slidesPerPage = Number(formData.get("slides_per_page") || 3);
  const mode = formData.get("mode") || "smart";
  const strength = Number(formData.get("strength") || 55);
  const orientation = formData.get("orientation") || "portrait";
  const marginPreset = formData.get("margin") || "normal";
  const drawBorder = formData.get("border") === "1";
  const pageNumbers = formData.get("page_numbers") === "1";
  const headerText = (formData.get("header_text") || "").trim();

  let [A4_W, A4_H] = orientation === "landscape" ? [842, 595] : [595, 842];
  const layouts = { 1: [1, 1], 2: [1, 2], 3: [1, 3], 4: [2, 2], 6: [2, 3], 8: [2, 4], 9: [3, 3] };
  let [cols, rows] = layouts[slidesPerPage] || [1, 3];
  if (orientation === "landscape" && [2, 3, 6].includes(slidesPerPage)) {
    [cols, rows] = [rows, cols];
  }

  const margin = marginPreset === "compact" ? 8 : (marginPreset === "wide" ? 24 : 14);
  const gap = marginPreset === "compact" ? 5 : (marginPreset === "wide" ? 10 : 7);
  const topExtra = headerText ? 16 : 0;
  const bottomExtra = pageNumbers ? 16 : 0;

  const cellW = (A4_W - 2 * margin - (cols - 1) * gap) / cols;
  const cellH = (A4_H - 2 * margin - topExtra - bottomExtra - (rows - 1) * gap) / rows;
  const perSheet = cols * rows;

  const outPdf = await PDFDocument.create();
  outPdf.setTitle(headerText || "Concentric Smart Notes");
  outPdf.setAuthor("Avadhesh Pingoriya");
  outPdf.setCreator("Concentric Notes Converter V2.3 by Avadhesh Pingoriya");

  const font = await outPdf.embedFont(StandardFonts.Helvetica);
  const sortedPages = [...selectedSlides].sort((a, b) => a - b);
  let outPage = null;

  for (let idx = 0; idx < sortedPages.length; idx++) {
    const pageNum = sortedPages[idx];
    const slot = idx % perSheet;
    if (slot === 0) {
      outPage = outPdf.addPage([A4_W, A4_H]);
    }
    notesFooterStatus.textContent = `Processing slide ${idx + 1} of ${sortedPages.length}…`;

    const srcPage = await pdfDoc.getPage(pageNum);
    const vp = srcPage.getViewport({ scale: 1.7 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(vp.width);
    canvas.height = Math.floor(vp.height);
    await srcPage.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;

    processCanvasInPlace(canvas, mode, strength);
    const dataUrl = canvas.toDataURL("image/png");
    const embeddedImg = await outPdf.embedPng(dataUrl);

    const row = Math.floor(slot / cols);
    const col = slot % cols;
    const x0 = margin + col * (cellW + gap);
    const y0Top = margin + topExtra + row * (cellH + gap);

    const iw = canvas.width;
    const ih = canvas.height;
    const scale = Math.min(cellW / iw, cellH / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const x = x0 + (cellW - dw) / 2;
    const yFromTop = y0Top + (cellH - dh) / 2;
    const pdfY = A4_H - yFromTop - dh;

    outPage.drawImage(embeddedImg, { x, y: pdfY, width: dw, height: dh });
    if (drawBorder) {
      outPage.drawRectangle({
        x, y: pdfY, width: dw, height: dh,
        borderColor: rgb(0.75, 0.75, 0.78),
        borderWidth: 0.6
      });
    }
  }

  const pagesList = outPdf.getPages();
  pagesList.forEach((p, i) => {
    if (headerText) {
      p.drawText(headerText, {
        x: margin, y: A4_H - margin - 8, size: 8.5, font, color: rgb(0.35, 0.35, 0.4)
      });
    }
    if (pageNumbers) {
      const lbl = `Page ${i + 1} of ${pagesList.length}`;
      const tw = font.widthOfTextAtSize(lbl, 8.5);
      p.drawText(lbl, {
        x: (A4_W - tw) / 2, y: margin - 2, size: 8.5, font, color: rgb(0.35, 0.35, 0.4)
      });
    }
  });

  const pdfBytes = await outPdf.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const file = pdfInput.files[0];
  if (!file || !selectedSlides.size) return;

  notesGenerateBtn.disabled = true;
  notesFooterStatus.textContent = "Generating full printable notes PDF…";

  const fd = new FormData(form);
  const headerName = (document.getElementById("headerText").value || "").trim();
  const outFilename = headerName
    ? `${headerName.replace(/[\\/:*?"<>|]/g, "_")}.pdf`
    : "Concentric_Notes_Output.pdf";

  try {
    let blob;
    if (backendAvailable && file.size <= VERCEL_SAFE_BYTES) {
      const r = await fetch("/process", { method: "POST", body: fd });
      if (!r.ok) throw new Error("Processing failed");
      blob = await r.blob();
    } else {
      blob = await processNotesClientSide(file, fd);
    }
    downloadBlob(blob, outFilename);
    notesFooterStatus.textContent = "Done! Your printable notes PDF has been downloaded.";
  } catch (err) {
    notesFooterStatus.textContent = "Error: " + err.message;
  } finally {
    notesGenerateBtn.disabled = false;
  }
});

// ==================== TOOL 2: MERGE LECTURES (2-STEP WIZARD) ====================
const mergeFilesInput = document.getElementById("mergeFiles");
const mergeList = document.getElementById("mergeList");
const mergeInfo = document.getElementById("mergeInfo");
const mergeBackBtn = document.getElementById("mergeBackBtn");
const mergeNextBtn = document.getElementById("mergeNextBtn");
const mergeButton = document.getElementById("mergeButton");
const mergeStatus = document.getElementById("mergeStatus");
const chapterName = document.getElementById("chapterName");
let mergeFiles = [];
let mergeStep = 1;

function goMergeStep(step) {
  mergeStep = step;
  const maxUnlocked = mergeFiles.length >= 2 ? 2 : 1;
  setWizardStep("merge", mergeStep, maxUnlocked);
  mergeBackBtn.disabled = mergeStep === 1;
  if (mergeStep === 1) {
    mergeNextBtn.style.display = "inline-flex";
    mergeButton.style.display = "none";
    mergeNextBtn.disabled = mergeFiles.length < 2;
    mergeStatus.textContent = mergeFiles.length
      ? `${mergeFiles.length} PDF(s) added. Need at least 2 to merge.`
      : "Step 1 of 2 · Add at least 2 lecture PDFs";
  } else {
    mergeNextBtn.style.display = "none";
    mergeButton.style.display = "inline-flex";
    mergeStatus.textContent = `Step 2 of 2 · ${mergeFiles.length} PDFs ready to merge`;
  }
}

document.querySelectorAll("#mergeTool .step-pill").forEach(p => {
  p.onclick = () => goMergeStep(Number(p.dataset.step));
});
mergeBackBtn.onclick = () => goMergeStep(1);
mergeNextBtn.onclick = () => { if (mergeFiles.length >= 2) goMergeStep(2); };

function renderMergeList() {
  const totalBytes = mergeFiles.reduce((acc, f) => acc + f.size, 0);
  mergeInfo.textContent = mergeFiles.length
    ? `${mergeFiles.length} PDF${mergeFiles.length === 1 ? "" : "s"} queued · ${formatFileSize(totalBytes)} total`
    : "Select 2 or more PDF files";

  mergeList.innerHTML = "";
  mergeFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "merge-item";
    item.innerHTML = `
      <div class="lecture-number">${index + 1}</div>
      <div class="merge-file-name">
        <b>${escapeHtml(file.name)}</b>
        <small>${formatFileSize(file.size)}</small>
      </div>
      <div class="merge-actions">
        <button type="button" data-action="up" ${index === 0 ? "disabled" : ""}>↑</button>
        <button type="button" data-action="down" ${index === mergeFiles.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" data-action="remove" class="remove">×</button>
      </div>`;
    item.querySelectorAll("button").forEach(btn => {
      btn.onclick = () => {
        const act = btn.dataset.action;
        if (act === "up" && index > 0) [mergeFiles[index - 1], mergeFiles[index]] = [mergeFiles[index], mergeFiles[index - 1]];
        if (act === "down" && index < mergeFiles.length - 1) [mergeFiles[index + 1], mergeFiles[index]] = [mergeFiles[index], mergeFiles[index + 1]];
        if (act === "remove") mergeFiles.splice(index, 1);
        renderMergeList();
        if (mergeFiles.length < 2 && mergeStep === 2) goMergeStep(1);
        else goMergeStep(mergeStep);
      };
    });
    mergeList.appendChild(item);
  });
}

mergeFilesInput.addEventListener("change", () => {
  const added = [...mergeFilesInput.files].filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
  mergeFiles.push(...added);
  mergeFilesInput.value = "";
  renderMergeList();
  if (mergeFiles.length >= 2) goMergeStep(2);
  else goMergeStep(1);
});

document.getElementById("clearMerge").onclick = () => {
  mergeFiles = [];
  renderMergeList();
  goMergeStep(1);
};

mergeButton.addEventListener("click", async () => {
  if (mergeFiles.length < 2) return;
  mergeButton.disabled = true;
  mergeStatus.textContent = "Merging lectures in order…";

  const totalBytes = mergeFiles.reduce((acc, f) => acc + f.size, 0);
  const name = chapterName.value.trim()
    ? `${chapterName.value.trim().replace(/[\\/:*?"<>|]/g, "-")}.pdf`
    : "Concentric_Full_Chapter.pdf";

  try {
    let blob;
    if (backendAvailable && totalBytes <= VERCEL_SAFE_BYTES) {
      const fd = new FormData();
      mergeFiles.forEach(f => fd.append("pdfs", f));
      fd.append("chapter_name", chapterName.value.trim());
      const r = await fetch("/merge", { method: "POST", body: fd });
      if (!r.ok) throw new Error("Merge failed");
      blob = await r.blob();
    } else {
      const { PDFDocument } = window.PDFLib;
      const mergedPdf = await PDFDocument.create();
      mergedPdf.setAuthor("Avadhesh Pingoriya");
      for (const f of mergeFiles) {
        const srcDoc = await PDFDocument.load(await f.arrayBuffer());
        const copied = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copied.forEach(p => mergedPdf.addPage(p));
      }
      blob = new Blob([await mergedPdf.save()], { type: "application/pdf" });
    }
    downloadBlob(blob, name);
    mergeStatus.textContent = "Done! Merged PDF downloaded.";
  } catch (err) {
    mergeStatus.textContent = "Error: " + err.message;
  } finally {
    mergeButton.disabled = false;
  }
});

// ==================== TOOL 3: SPLIT & EXTRACT (2-STEP WIZARD) ====================
const splitInput = document.getElementById("splitPdfInput");
const splitThumbs = document.getElementById("splitThumbs");
const splitRangeInput = document.getElementById("splitRangeInput");
const splitStatus = document.getElementById("splitStatus");
const splitBackBtn = document.getElementById("splitBackBtn");
const splitNextBtn = document.getElementById("splitNextBtn");
const splitRunBtn = document.getElementById("splitRunBtn");
let splitSelected = new Set();
let splitTotal = 0;
let splitStep = 1;

function goSplitStep(step) {
  splitStep = step;
  setWizardStep("split", splitStep, splitTotal > 0 ? 2 : 1);
  splitBackBtn.disabled = splitStep === 1;
  splitNextBtn.style.display = splitStep === 1 ? "inline-flex" : "none";
  splitNextBtn.disabled = splitTotal === 0;
  splitRunBtn.style.display = splitStep === 2 ? "inline-flex" : "none";
  splitStatus.textContent = splitStep === 1
    ? "Step 1 of 2 · Upload a PDF to extract pages"
    : `Step 2 of 2 · ${splitSelected.size} of ${splitTotal} pages selected`;
}

document.querySelectorAll("#splitTool .step-pill").forEach(p => {
  p.onclick = () => goSplitStep(Number(p.dataset.step));
});
splitBackBtn.onclick = () => goSplitStep(1);
splitNextBtn.onclick = () => { if (splitTotal > 0) goSplitStep(2); };

function syncSplitUI(updateInput = true) {
  splitThumbs.querySelectorAll(".thumb").forEach(el => {
    const p = Number(el.dataset.page);
    const active = splitSelected.has(p);
    el.classList.toggle("active", active);
    el.querySelector(".check").textContent = active ? "✓" : "";
  });
  if (updateInput) {
    splitRangeInput.value = [...splitSelected].sort((a, b) => a - b).join(", ");
  }
  if (splitStep === 2) {
    splitStatus.textContent = `Step 2 of 2 · ${splitSelected.size} of ${splitTotal} pages selected`;
  }
}

splitInput.addEventListener("change", async () => {
  const file = splitInput.files[0];
  if (!file) return;
  document.getElementById("splitFileInfo").textContent = `Loading ${file.name}…`;
  splitThumbs.innerHTML = "";
  splitSelected.clear();
  try {
    const d = await getPreviewData(file);
    splitTotal = d.pages;
    d.thumbs.forEach(t => {
      splitSelected.add(t.page);
      const el = document.createElement("div");
      el.className = "thumb active";
      el.dataset.page = t.page;
      el.innerHTML = `<div class="check">✓</div><img src="${t.image}" alt="Page ${t.page}"><div class="num">Page ${t.page}</div>`;
      el.onclick = () => {
        splitSelected.has(t.page) ? splitSelected.delete(t.page) : splitSelected.add(t.page);
        syncSplitUI(true);
      };
      splitThumbs.appendChild(el);
    });
    document.getElementById("splitFileInfo").textContent = `${file.name} (${splitTotal} pages)`;
    syncSplitUI(true);
    goSplitStep(2);
  } catch (err) {
    splitStatus.textContent = "Error: " + err.message;
  }
});

splitRangeInput.addEventListener("input", () => {
  if (!splitTotal) return;
  splitSelected = new Set(parsePageSpec(splitRangeInput.value, splitTotal));
  syncSplitUI(false);
});

document.getElementById("splitSelectAll").onclick = () => {
  for (let i = 1; i <= splitTotal; i++) splitSelected.add(i);
  syncSplitUI(true);
};
document.getElementById("splitSelectOdd").onclick = () => {
  splitSelected.clear();
  for (let i = 1; i <= splitTotal; i += 2) splitSelected.add(i);
  syncSplitUI(true);
};
document.getElementById("splitSelectEven").onclick = () => {
  splitSelected.clear();
  for (let i = 2; i <= splitTotal; i += 2) splitSelected.add(i);
  syncSplitUI(true);
};
document.getElementById("splitClear").onclick = () => {
  splitSelected.clear();
  syncSplitUI(true);
};

splitRunBtn.onclick = async () => {
  const file = splitInput.files[0];
  if (!file || !splitSelected.size) return;
  splitRunBtn.disabled = true;
  splitStatus.textContent = "Extracting selected pages…";
  const outName = (document.getElementById("splitOutName").value || "Concentric_Extracted").trim();

  try {
    let blob;
    const pagesList = [...splitSelected].sort((a, b) => a - b);
    if (backendAvailable && file.size <= VERCEL_SAFE_BYTES) {
      const fd = new FormData();
      fd.append("pdf", file);
      fd.append("pages", pagesList.join(","));
      fd.append("output_name", outName);
      const r = await fetch("/organize", { method: "POST", body: fd });
      if (!r.ok) throw new Error("Extraction failed");
      blob = await r.blob();
    } else {
      const { PDFDocument } = window.PDFLib;
      const srcDoc = await PDFDocument.load(await file.arrayBuffer());
      const outDoc = await PDFDocument.create();
      outDoc.setAuthor("Avadhesh Pingoriya");
      const copied = await outDoc.copyPages(srcDoc, pagesList.map(p => p - 1));
      copied.forEach(p => outDoc.addPage(p));
      blob = new Blob([await outDoc.save()], { type: "application/pdf" });
    }
    downloadBlob(blob, `${outName.replace(/\.pdf$/i, "")}.pdf`);
    splitStatus.textContent = "Done! Extracted PDF downloaded.";
  } catch (err) {
    splitStatus.textContent = "Error: " + err.message;
  } finally {
    splitRunBtn.disabled = false;
  }
};

// ==================== TOOL 4: ORGANIZE & ROTATE (2-STEP WIZARD) ====================
const orgInput = document.getElementById("orgPdfInput");
const orgGrid = document.getElementById("orgGrid");
const orgStatus = document.getElementById("orgStatus");
const orgBackBtn = document.getElementById("orgBackBtn");
const orgNextBtn = document.getElementById("orgNextBtn");
const orgSaveBtn = document.getElementById("orgSaveBtn");
let orgPagesOriginal = [];
let orgPagesState = [];
let orgStep = 1;

function goOrgStep(step) {
  orgStep = step;
  setWizardStep("organize", orgStep, orgPagesOriginal.length > 0 ? 2 : 1);
  orgBackBtn.disabled = orgStep === 1;
  orgNextBtn.style.display = orgStep === 1 ? "inline-flex" : "none";
  orgNextBtn.disabled = orgPagesOriginal.length === 0;
  orgSaveBtn.style.display = orgStep === 2 ? "inline-flex" : "none";
  orgStatus.textContent = orgStep === 1
    ? "Step 1 of 2 · Upload a PDF to rotate or reorder pages"
    : `Step 2 of 2 · ${orgPagesState.length} pages in document`;
}

document.querySelectorAll("#organizeTool .step-pill").forEach(p => {
  p.onclick = () => goOrgStep(Number(p.dataset.step));
});
orgBackBtn.onclick = () => goOrgStep(1);
orgNextBtn.onclick = () => { if (orgPagesOriginal.length > 0) goOrgStep(2); };

function renderOrgGrid() {
  orgGrid.innerHTML = "";
  orgPagesState.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "thumb active";
    card.innerHTML = `
      <img src="${item.image}" alt="Page ${item.page}" style="transform: rotate(${item.rotate}deg)">
      <div class="num">Page ${item.page} ${item.rotate ? `(${item.rotate}°)` : ""}</div>
      <div class="org-card-actions">
        <button type="button" data-act="left" ${idx === 0 ? "disabled" : ""}>←</button>
        <button type="button" data-act="rotL">↺</button>
        <button type="button" data-act="rotR">↻</button>
        <button type="button" data-act="right" ${idx === orgPagesState.length - 1 ? "disabled" : ""}>→</button>
        <button type="button" data-act="del" class="del-btn">×</button>
      </div>`;
    card.querySelectorAll("button").forEach(b => {
      b.onclick = e => {
        e.stopPropagation();
        const act = b.dataset.act;
        if (act === "left" && idx > 0) [orgPagesState[idx - 1], orgPagesState[idx]] = [orgPagesState[idx], orgPagesState[idx - 1]];
        if (act === "right" && idx < orgPagesState.length - 1) [orgPagesState[idx + 1], orgPagesState[idx]] = [orgPagesState[idx], orgPagesState[idx + 1]];
        if (act === "rotL") item.rotate = (item.rotate + 270) % 360;
        if (act === "rotR") item.rotate = (item.rotate + 90) % 360;
        if (act === "del") orgPagesState.splice(idx, 1);
        renderOrgGrid();
        orgStatus.textContent = `Step 2 of 2 · ${orgPagesState.length} pages in document`;
      };
    });
    orgGrid.appendChild(card);
  });
}

orgInput.addEventListener("change", async () => {
  const file = orgInput.files[0];
  if (!file) return;
  document.getElementById("orgFileInfo").textContent = `Loading ${file.name}…`;
  try {
    const d = await getPreviewData(file);
    orgPagesOriginal = d.thumbs.map(t => ({ page: t.page, rotate: 0, image: t.image }));
    orgPagesState = orgPagesOriginal.map(x => ({ ...x }));
    document.getElementById("orgFileInfo").textContent = `${file.name} (${orgPagesOriginal.length} pages)`;
    renderOrgGrid();
    goOrgStep(2);
  } catch (err) {
    orgStatus.textContent = "Error: " + err.message;
  }
});

document.getElementById("orgRotateAllLeft").onclick = () => {
  orgPagesState.forEach(p => (p.rotate = (p.rotate + 270) % 360));
  renderOrgGrid();
};
document.getElementById("orgRotateAllRight").onclick = () => {
  orgPagesState.forEach(p => (p.rotate = (p.rotate + 90) % 360));
  renderOrgGrid();
};
document.getElementById("orgResetBtn").onclick = () => {
  orgPagesState = orgPagesOriginal.map(x => ({ ...x }));
  renderOrgGrid();
};

orgSaveBtn.onclick = async () => {
  const file = orgInput.files[0];
  if (!file || !orgPagesState.length) return;
  orgSaveBtn.disabled = true;
  orgStatus.textContent = "Saving organized PDF…";
  try {
    let blob;
    if (backendAvailable && file.size <= VERCEL_SAFE_BYTES) {
      const fd = new FormData();
      fd.append("pdf", file);
      fd.append("operations", JSON.stringify(orgPagesState.map(p => ({ page: p.page, rotate: p.rotate }))));
      const r = await fetch("/organize", { method: "POST", body: fd });
      if (!r.ok) throw new Error("Failed to save organized PDF");
      blob = await r.blob();
    } else {
      const { PDFDocument, degrees } = window.PDFLib;
      const srcDoc = await PDFDocument.load(await file.arrayBuffer());
      const outDoc = await PDFDocument.create();
      outDoc.setAuthor("Avadhesh Pingoriya");
      for (const item of orgPagesState) {
        const [copied] = await outDoc.copyPages(srcDoc, [item.page - 1]);
        if (item.rotate) {
          const cur = copied.getRotation().angle || 0;
          copied.setRotation(degrees((cur + item.rotate) % 360));
        }
        outDoc.addPage(copied);
      }
      blob = new Blob([await outDoc.save()], { type: "application/pdf" });
    }
    downloadBlob(blob, "Concentric_Organized.pdf");
    orgStatus.textContent = "Done! Organized PDF downloaded.";
  } catch (err) {
    orgStatus.textContent = "Error: " + err.message;
  } finally {
    orgSaveBtn.disabled = false;
  }
};

// ==================== TOOL 5: IMAGES TO PDF (2-STEP WIZARD) ====================
const imgFilesInput = document.getElementById("imgFilesInput");
const imgList = document.getElementById("imgList");
const img2pdfStatus = document.getElementById("img2pdfStatus");
const imgBackBtn = document.getElementById("imgBackBtn");
const imgNextBtn = document.getElementById("imgNextBtn");
const img2pdfBtn = document.getElementById("img2pdfBtn");
let queuedImages = [];
let imgStep = 1;

function goImgStep(step) {
  imgStep = step;
  setWizardStep("img2pdf", imgStep, queuedImages.length > 0 ? 2 : 1);
  imgBackBtn.disabled = imgStep === 1;
  imgNextBtn.style.display = imgStep === 1 ? "inline-flex" : "none";
  imgNextBtn.disabled = queuedImages.length === 0;
  img2pdfBtn.style.display = imgStep === 2 ? "inline-flex" : "none";
  img2pdfStatus.textContent = imgStep === 1
    ? "Step 1 of 2 · Select photos or slide images"
    : `Step 2 of 2 · ${queuedImages.length} image(s) ready`;
}

document.querySelectorAll("#img2pdfTool .step-pill").forEach(p => {
  p.onclick = () => goImgStep(Number(p.dataset.step));
});
imgBackBtn.onclick = () => goImgStep(1);
imgNextBtn.onclick = () => { if (queuedImages.length > 0) goImgStep(2); };

function renderImgQueue() {
  document.getElementById("imgFilesInfo").textContent = queuedImages.length
    ? `${queuedImages.length} image(s) queued`
    : "No images selected yet";
  imgList.innerHTML = "";
  queuedImages.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "merge-item";
    item.innerHTML = `
      <div class="lecture-number">${index + 1}</div>
      <div class="merge-file-name">
        <b>${escapeHtml(file.name)}</b>
        <small>${formatFileSize(file.size)}</small>
      </div>
      <div class="merge-actions">
        <button type="button" data-act="up" ${index === 0 ? "disabled" : ""}>↑</button>
        <button type="button" data-act="down" ${index === queuedImages.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" data-act="rm" class="remove">×</button>
      </div>`;
    item.querySelectorAll("button").forEach(b => {
      b.onclick = () => {
        const act = b.dataset.act;
        if (act === "up" && index > 0) [queuedImages[index - 1], queuedImages[index]] = [queuedImages[index], queuedImages[index - 1]];
        if (act === "down" && index < queuedImages.length - 1) [queuedImages[index + 1], queuedImages[index]] = [queuedImages[index], queuedImages[index + 1]];
        if (act === "rm") queuedImages.splice(index, 1);
        renderImgQueue();
        if (!queuedImages.length) goImgStep(1);
      };
    });
    imgList.appendChild(item);
  });
}

imgFilesInput.addEventListener("change", () => {
  queuedImages.push(...imgFilesInput.files);
  imgFilesInput.value = "";
  renderImgQueue();
  if (queuedImages.length > 0) goImgStep(2);
});

document.getElementById("clearImgsBtn").onclick = () => {
  queuedImages = [];
  renderImgQueue();
  goImgStep(1);
};

img2pdfBtn.onclick = async () => {
  if (!queuedImages.length) return;
  img2pdfBtn.disabled = true;
  img2pdfStatus.textContent = "Converting images to PDF…";

  const mode = document.querySelector('input[name="img_mode"]:checked').value;
  const pageSize = document.querySelector('input[name="img_page_size"]:checked').value;
  const totalBytes = queuedImages.reduce((a, f) => a + f.size, 0);

  try {
    let blob;
    if (backendAvailable && totalBytes <= VERCEL_SAFE_BYTES) {
      const fd = new FormData();
      queuedImages.forEach(f => fd.append("images", f));
      fd.append("mode", mode);
      fd.append("page_size", pageSize);
      const r = await fetch("/images-to-pdf", { method: "POST", body: fd });
      if (!r.ok) throw new Error("Conversion failed");
      blob = await r.blob();
    } else {
      const { PDFDocument } = window.PDFLib;
      const outPdf = await PDFDocument.create();
      outPdf.setAuthor("Avadhesh Pingoriya");
      for (const imgFile of queuedImages) {
        const bitmap = await createImageBitmap(imgFile);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext("2d").drawImage(bitmap, 0, 0);
        processCanvasInPlace(canvas, mode, 55);
        const jpgUrl = canvas.toDataURL("image/jpeg", 0.88);
        const embedded = await outPdf.embedJpg(jpgUrl);

        if (pageSize === "fit") {
          const p = outPdf.addPage([canvas.width, canvas.height]);
          p.drawImage(embedded, { x: 0, y: 0, width: canvas.width, height: canvas.height });
        } else {
          const [W, H] = pageSize === "a4_landscape" ? [842, 595] : [595, 842];
          const margin = 18;
          const p = outPdf.addPage([W, H]);
          const cw = W - 2 * margin, ch = H - 2 * margin;
          const scale = Math.min(cw / canvas.width, ch / canvas.height);
          const dw = canvas.width * scale, dh = canvas.height * scale;
          p.drawImage(embedded, {
            x: margin + (cw - dw) / 2,
            y: margin + (ch - dh) / 2,
            width: dw,
            height: dh
          });
        }
      }
      blob = new Blob([await outPdf.save()], { type: "application/pdf" });
    }
    downloadBlob(blob, "Concentric_Images_Notes.pdf");
    img2pdfStatus.textContent = "Done! Images PDF downloaded.";
  } catch (err) {
    img2pdfStatus.textContent = "Error: " + err.message;
  } finally {
    img2pdfBtn.disabled = false;
  }
};

// ==================== TOOL 6: PDF TO IMAGES (2-STEP WIZARD) ====================
const p2iInput = document.getElementById("p2iInput");
const p2iThumbs = document.getElementById("p2iThumbs");
const p2iStatus = document.getElementById("p2iStatus");
const p2iBackBtn = document.getElementById("p2iBackBtn");
const p2iNextBtn = document.getElementById("p2iNextBtn");
const p2iRunBtn = document.getElementById("p2iRunBtn");
let p2iSelected = new Set();
let p2iTotal = 0;
let p2iStep = 1;

function goP2iStep(step) {
  p2iStep = step;
  setWizardStep("pdf2img", p2iStep, p2iTotal > 0 ? 2 : 1);
  p2iBackBtn.disabled = p2iStep === 1;
  p2iNextBtn.style.display = p2iStep === 1 ? "inline-flex" : "none";
  p2iNextBtn.disabled = p2iTotal === 0;
  p2iRunBtn.style.display = p2iStep === 2 ? "inline-flex" : "none";
  p2iStatus.textContent = p2iStep === 1
    ? "Step 1 of 2 · Upload a PDF to export slides as images"
    : `Step 2 of 2 · ${p2iSelected.size} of ${p2iTotal} slides selected`;
}

document.querySelectorAll("#pdf2imgTool .step-pill").forEach(p => {
  p.onclick = () => goP2iStep(Number(p.dataset.step));
});
p2iBackBtn.onclick = () => goP2iStep(1);
p2iNextBtn.onclick = () => { if (p2iTotal > 0) goP2iStep(2); };

function updateP2iUI() {
  p2iThumbs.querySelectorAll(".thumb").forEach(el => {
    const p = Number(el.dataset.page);
    const active = p2iSelected.has(p);
    el.classList.toggle("active", active);
    el.querySelector(".check").textContent = active ? "✓" : "";
  });
  if (p2iStep === 2) {
    p2iStatus.textContent = `Step 2 of 2 · ${p2iSelected.size} of ${p2iTotal} slides selected`;
  }
}

p2iInput.addEventListener("change", async () => {
  const file = p2iInput.files[0];
  if (!file) return;
  document.getElementById("p2iFileInfo").textContent = `Loading ${file.name}…`;
  p2iThumbs.innerHTML = "";
  p2iSelected.clear();
  try {
    const d = await getPreviewData(file);
    p2iTotal = d.pages;
    d.thumbs.forEach(t => {
      p2iSelected.add(t.page);
      const el = document.createElement("div");
      el.className = "thumb active";
      el.dataset.page = t.page;
      el.innerHTML = `<div class="check">✓</div><img src="${t.image}" alt="Slide ${t.page}"><div class="num">Slide ${t.page}</div>`;
      el.onclick = () => {
        p2iSelected.has(t.page) ? p2iSelected.delete(t.page) : p2iSelected.add(t.page);
        updateP2iUI();
      };
      p2iThumbs.appendChild(el);
    });
    document.getElementById("p2iFileInfo").textContent = `${file.name} (${p2iTotal} slides)`;
    updateP2iUI();
    goP2iStep(2);
  } catch (err) {
    p2iStatus.textContent = "Error: " + err.message;
  }
});

document.getElementById("p2iAllBtn").onclick = () => {
  for (let i = 1; i <= p2iTotal; i++) p2iSelected.add(i);
  updateP2iUI();
};
document.getElementById("p2iClearBtn").onclick = () => {
  p2iSelected.clear();
  updateP2iUI();
};

p2iRunBtn.onclick = async () => {
  const file = p2iInput.files[0];
  if (!file || !p2iSelected.size) return;
  p2iRunBtn.disabled = true;
  p2iStatus.textContent = "Rendering high-res slide images into ZIP…";
  const fmt = document.querySelector('input[name="p2i_format"]:checked').value;
  const pagesList = [...p2iSelected].sort((a, b) => a - b);

  try {
    let zipBlob;
    if (backendAvailable && file.size <= VERCEL_SAFE_BYTES) {
      const fd = new FormData();
      fd.append("pdf", file);
      fd.append("pages", pagesList.join(","));
      fd.append("format", fmt);
      const r = await fetch("/pdf-to-images", { method: "POST", body: fd });
      if (!r.ok) throw new Error("Failed to export images");
      zipBlob = await r.blob();
    } else {
      const zip = new window.JSZip();
      const pdfDoc = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      for (const pNum of pagesList) {
        const page = await pdfDoc.getPage(pNum);
        const vp = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
        const mime = fmt === "jpg" ? "image/jpeg" : "image/png";
        const dataUrl = canvas.toDataURL(mime, 0.9);
        const base64Data = dataUrl.split(",")[1];
        zip.file(`Slide_${String(pNum).padStart(3, "0")}.${fmt}`, base64Data, { base64: true });
      }
      zipBlob = await zip.generateAsync({ type: "blob" });
    }
    downloadBlob(zipBlob, "Concentric_Slides_Images.zip");
    p2iStatus.textContent = "Done! ZIP archive downloaded.";
  } catch (err) {
    p2iStatus.textContent = "Error: " + err.message;
  } finally {
    p2iRunBtn.disabled = false;
  }
};
