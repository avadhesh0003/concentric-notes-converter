// Concentric Notes Converter
// Notes processing pipeline remains unchanged from V1.2.

const pdf = document.getElementById("pdf");
const thumbs = document.getElementById("thumbnails");
const fileInfo = document.getElementById("fileInfo");
const pageInfo = document.getElementById("pageInfo");
const pagesInput = document.getElementById("pages");
const form = document.getElementById("form");
const status = document.getElementById("status");
const strength = document.getElementById("strength");
const strengthValue = document.getElementById("strengthValue");
let selected = new Set();

// Tool tabs
document.querySelectorAll(".tool-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tool-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tool-panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tool + "Tool").classList.add("active");
    document.getElementById("crumb").textContent = tab.dataset.tool === "merge" ? "Merge lectures" : "Process notes";
    document.querySelectorAll(".nav-item").forEach(t => t.classList.toggle("active", t === tab));
    window.scrollTo({top: 0, behavior: "smooth"});
  });
});

strength.addEventListener("input", () => strengthValue.textContent = strength.value);

function updateSelected() {
  document.querySelectorAll(".thumb").forEach(el => {
    const p = Number(el.dataset.page);
    el.classList.toggle("active", selected.has(p));
    el.querySelector(".check").textContent = selected.has(p) ? "✓" : "";
  });
  pagesInput.value = [...selected].sort((a,b)=>a-b).join(",");
  pageInfo.textContent = `${selected.size} slide${selected.size===1?"":"s"} selected`;
}

pdf.addEventListener("change", async () => {
  const file = pdf.files[0];
  if (!file) return;
  fileInfo.textContent = `${file.name} · ${(file.size/1024/1024).toFixed(2)} MB`;
  pageInfo.textContent = "Creating slide previews…";
  thumbs.innerHTML = "";
  selected.clear();
  const fd = new FormData();
  fd.append("pdf", file);
  try {
    const r = await fetch("/preview", {method:"POST", body:fd});
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Preview failed");
    d.thumbs.forEach(t => {
      selected.add(t.page);
      const el = document.createElement("div");
      el.className = "thumb active";
      el.dataset.page = t.page;
      el.innerHTML = `<div class="check">✓</div><img src="${t.image}" alt="Slide ${t.page}"><div class="num">Slide ${t.page}</div>`;
      el.onclick = () => {
        selected.has(t.page) ? selected.delete(t.page) : selected.add(t.page);
        updateSelected();
      };
      thumbs.appendChild(el);
    });
    updateSelected();
  } catch(e) {
    pageInfo.textContent = "Preview error: " + e.message;
  }
});

document.getElementById("all").onclick = () => {
  document.querySelectorAll(".thumb").forEach(e => selected.add(Number(e.dataset.page)));
  updateSelected();
};
document.getElementById("none").onclick = () => {
  selected.clear();
  updateSelected();
};

form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!selected.size) {
    status.textContent = "Select at least one slide.";
    return;
  }
  const btn = document.getElementById("generate");
  btn.disabled = true;
  status.textContent = "Processing slides with Smart Ink Saver…";
  try {
    const r = await fetch("/process", {method:"POST", body:new FormData(form)});
    if (!r.ok) throw new Error(await r.text());
    const blob = await r.blob();
    downloadBlob(blob, "Concentric_Notes_Output.pdf");
    status.textContent = "Done. Your notes PDF is ready.";
  } catch(err) {
    status.textContent = "Error: " + err.message;
  } finally {
    btn.disabled = false;
  }
});

// ---------- PDF MERGER ----------
const mergeFilesInput = document.getElementById("mergeFiles");
const mergeList = document.getElementById("mergeList");
const mergeInfo = document.getElementById("mergeInfo");
const mergeStatus = document.getElementById("mergeStatus");
const mergeButton = document.getElementById("mergeButton");
const chapterName = document.getElementById("chapterName");
let mergeFiles = [];

function fileSize(bytes) {
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(0)} KB`;
  return `${(bytes/1024/1024).toFixed(2)} MB`;
}

function renderMergeList() {
  if (!mergeFiles.length) {
    mergeList.innerHTML = '<div class="empty-state">Your selected lecture PDFs will appear here.</div>';
    mergeInfo.textContent = "No PDFs added yet.";
    return;
  }

  const totalMB = mergeFiles.reduce((n,f)=>n+f.size,0)/1024/1024;
  mergeInfo.textContent = `${mergeFiles.length} lecture PDF${mergeFiles.length===1?"":"s"} · ${totalMB.toFixed(2)} MB total`;

  mergeList.innerHTML = "";
  mergeFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "merge-item";
    item.innerHTML = `
      <div class="lecture-number">${index+1}</div>
      <div class="merge-file-icon">PDF</div>
      <div class="merge-file-name"><b>${escapeHtml(file.name)}</b><small>${fileSize(file.size)}</small></div>
      <div class="merge-actions">
        <button type="button" data-action="up" title="Move up" ${index===0?"disabled":""}>↑</button>
        <button type="button" data-action="down" title="Move down" ${index===mergeFiles.length-1?"disabled":""}>↓</button>
        <button type="button" data-action="remove" class="remove" title="Remove">×</button>
      </div>`;
    item.querySelectorAll("button").forEach(btn => {
      btn.onclick = () => {
        const action = btn.dataset.action;
        if (action === "up" && index > 0) [mergeFiles[index-1], mergeFiles[index]] = [mergeFiles[index], mergeFiles[index-1]];
        if (action === "down" && index < mergeFiles.length-1) [mergeFiles[index+1], mergeFiles[index]] = [mergeFiles[index], mergeFiles[index+1]];
        if (action === "remove") mergeFiles.splice(index, 1);
        renderMergeList();
      };
    });
    mergeList.appendChild(item);
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

mergeFilesInput.addEventListener("change", () => {
  const added = [...mergeFilesInput.files].filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
  mergeFiles.push(...added);
  mergeFilesInput.value = "";
  mergeStatus.textContent = "";
  renderMergeList();
});

document.getElementById("clearMerge").onclick = () => {
  mergeFiles = [];
  mergeStatus.textContent = "";
  renderMergeList();
};

mergeButton.addEventListener("click", async () => {
  if (mergeFiles.length < 2) {
    mergeStatus.textContent = "Add at least 2 lecture PDFs to merge.";
    return;
  }
  const fd = new FormData();
  mergeFiles.forEach(f => fd.append("pdfs", f));
  fd.append("chapter_name", chapterName.value.trim());

  mergeButton.disabled = true;
  mergeStatus.textContent = "Merging lectures in your selected order…";
  try {
    const r = await fetch("/merge", {method:"POST", body:fd});
    if (!r.ok) {
      let message = "Merge failed";
      try { message = (await r.json()).error || message; }
      catch { message = await r.text() || message; }
      throw new Error(message);
    }
    const blob = await r.blob();
    const name = chapterName.value.trim()
      ? `${chapterName.value.trim().replace(/[\\/:*?"<>|]/g, "-")}.pdf`
      : "Concentric_Full_Chapter.pdf";
    downloadBlob(blob, name);
    mergeStatus.textContent = "Done. Your full chapter PDF is ready.";
  } catch(err) {
    mergeStatus.textContent = "Error: " + err.message;
  } finally {
    mergeButton.disabled = false;
  }
});

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}


// Concentric UI helpers
document.getElementById("year").textContent = new Date().getFullYear();
const dropzone = document.getElementById("dropzone");
if (dropzone) {
  ["dragenter", "dragover"].forEach(eventName => dropzone.addEventListener(eventName, e => {
    e.preventDefault(); dropzone.classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach(eventName => dropzone.addEventListener(eventName, e => {
    e.preventDefault(); dropzone.classList.remove("dragging");
  }));
  dropzone.addEventListener("drop", e => {
    const file = [...e.dataTransfer.files].find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (!file) { fileInfo.textContent = "Please drop a PDF file."; return; }
    const transfer = new DataTransfer(); transfer.items.add(file); pdf.files = transfer.files;
    pdf.dispatchEvent(new Event("change", {bubbles:true}));
  });
}
