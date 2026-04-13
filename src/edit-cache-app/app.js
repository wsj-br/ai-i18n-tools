/* global fetch, document, alert, confirm */
(function () {
  "use strict";

  const UI_PAGE_SIZE = 25;
  const GL_PAGE_SIZE = 25;

  function escapeHtml(str) {
    if (str == null) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function truncate(str, maxLen) {
    if (str == null) return "";
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen) + "\u2026";
  }

  function setStatus(el, msg, ok) {
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("ok", Boolean(ok));
    el.style.color = ok ? "#3fb950" : "#d29922";
  }

  /** Column label with config source locale, e.g. `Source (en-GB)`. */
  function formatWithSourceLocale(baseLabel, sourceLocale) {
    const s =
      sourceLocale != null && String(sourceLocale).trim() !== ""
        ? String(sourceLocale).trim()
        : "en";
    return `${baseLabel} (${s})`;
  }

  // ---------- Segments (reference parity, seg-* ids) ----------
  const seg = {
    PAGE_SIZE_DEFAULT: 25,
    currentPage: 1,
    pageSize: 50,
    total: 0,
    editingRow: null,
    filters: {
      filename: "",
      locale: "",
      model: "",
      source_hash: "",
      source_text: "",
      translated_text: "",
      /** "" | "stale" (last_hit_at IS NULL) | "active" (last_hit_at IS NOT NULL) */
      last_hit: "",
    },
  };

  function segBuildQueryParams() {
    const params = new URLSearchParams();
    params.set("page", String(seg.currentPage));
    params.set("pageSize", String(seg.pageSize));
    if (seg.filters.filename) params.set("filename", seg.filters.filename);
    if (seg.filters.locale) params.set("locale", seg.filters.locale);
    if (seg.filters.model) params.set("model", seg.filters.model);
    if (seg.filters.source_hash) params.set("source_hash", seg.filters.source_hash);
    if (seg.filters.source_text) params.set("source_text", seg.filters.source_text);
    if (seg.filters.translated_text) params.set("translated_text", seg.filters.translated_text);
    if (seg.filters.last_hit === "stale") params.set("last_hit_at_null", "true");
    if (seg.filters.last_hit === "active") params.set("last_hit_at_not_null", "true");
    return params.toString();
  }

  async function segFetchTranslations() {
    const res = await fetch(`/api/translations?${segBuildQueryParams()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function segFetchFilepaths() {
    const res = await fetch("/api/filepaths");
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function segRenderTable(rows) {
    const tbody = document.getElementById("seg-table-body");
    tbody.innerHTML = "";

    for (const row of rows) {
      const tr = document.createElement("tr");
      tr.dataset.sourceHash = row.source_hash;
      tr.dataset.locale = row.locale;

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-btn";
      editBtn.title = "Edit";
      editBtn.textContent = "\u270F\uFE0F";
      editBtn.addEventListener("click", () => segOpenEditModal(row));

      const logLinksBtn = document.createElement("button");
      logLinksBtn.type = "button";
      logLinksBtn.className = "icon-btn log-links-btn";
      logLinksBtn.title = "Show file links in server console";
      logLinksBtn.textContent = "\uD83D\uDD17";
      logLinksBtn.addEventListener("click", (e) => segLogLinksToServer(row, e));

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "icon-btn delete-btn";
      deleteBtn.title = "Delete";
      deleteBtn.textContent = "\u274C";
      deleteBtn.addEventListener("click", () => segDeleteRow(row));

      const lineVal = row.start_line != null ? String(row.start_line) : "";
      tr.innerHTML = `
        <td>${escapeHtml(row.filepath || "")}</td>
        <td>${escapeHtml(lineVal)}</td>
        <td><code>${escapeHtml(row.source_hash)}</code></td>
        <td class="source-text" title="${escapeHtml(row.source_text || "")}">${escapeHtml(truncate(row.source_text, 200))}</td>
        <td>${escapeHtml(row.locale)}</td>
        <td class="translated-text" title="${escapeHtml(row.translated_text || "")}">${escapeHtml(truncate(row.translated_text, 200))}</td>
        <td>${escapeHtml(row.model || "")}</td>
        <td>${escapeHtml(row.created_at || "")}</td>
        <td class="last-hit-at ${row.last_hit_at ? "" : "stale"}" title="${escapeHtml(row.last_hit_at || "null")}">${escapeHtml(row.last_hit_at || "\u2014")}</td>
        <td class="actions"></td>
      `;
      tr.querySelector(".actions").append(editBtn, logLinksBtn, deleteBtn);
      tbody.appendChild(tr);
    }
  }

  function segUpdatePagination(data) {
    seg.total = data.total;
    const totalPages = Math.max(1, Math.ceil(seg.total / seg.pageSize));

    const info = `Showing ${(seg.currentPage - 1) * seg.pageSize + 1}\u2013${Math.min(seg.currentPage * seg.pageSize, seg.total)} of ${seg.total}`;
    document.getElementById("seg-pagination-info").textContent = info;
    document.getElementById("seg-pagination-info-bottom").textContent = info;

    const pi = `Page ${seg.currentPage} of ${totalPages}`;
    document.getElementById("seg-page-indicator").textContent = pi;
    document.getElementById("seg-page-indicator-bottom").textContent = pi;

    document.getElementById("seg-btn-prev").disabled = seg.currentPage <= 1;
    document.getElementById("seg-btn-next").disabled = seg.currentPage >= totalPages;
    document.getElementById("seg-btn-prev-bottom").disabled = seg.currentPage <= 1;
    document.getElementById("seg-btn-next-bottom").disabled = seg.currentPage >= totalPages;
  }

  async function segLoadData() {
    try {
      const data = await segFetchTranslations();
      segRenderTable(data.rows);
      segUpdatePagination(data);
    } catch (err) {
      alert("Error loading data: " + err.message);
    } finally {
      const applyBtn = document.getElementById("seg-btn-apply");
      if (applyBtn) {
        applyBtn.textContent = "Apply";
        applyBtn.disabled = false;
      }
    }
  }

  function segFillFilepathSelects(filepaths) {
    const del = document.getElementById("seg-select-filepath");
    const filterFp = document.getElementById("seg-filter-filepath-select");
    const preserveDel = del.value;
    const preserveFilter = filterFp.value;
    for (const sel of [del, filterFp]) {
      const preserved = sel === del ? preserveDel : preserveFilter;
      sel.innerHTML = '<option value="">-- Select filepath --</option>';
      for (const fp of filepaths) {
        const opt = document.createElement("option");
        opt.value = fp;
        opt.textContent = fp;
        sel.appendChild(opt);
      }
      if (preserved && Array.from(sel.options).some((o) => o.value === preserved)) {
        sel.value = preserved;
      }
    }
  }

  async function segLoadFilepaths() {
    try {
      const data = await segFetchFilepaths();
      segFillFilepathSelects(data.filepaths);
    } catch (err) {
      console.error("Error loading filepaths:", err);
    }
  }

  /** Keep filter filepath select aligned when filename exactly matches a known path. */
  function segSyncFilterFilepathSelect() {
    const fn = document.getElementById("seg-filter-filename").value.trim();
    const sel = document.getElementById("seg-filter-filepath-select");
    if (!fn || !Array.from(sel.options).some((o) => o.value === fn)) {
      sel.value = "";
    } else {
      sel.value = fn;
    }
  }

  function segOpenEditModal(row) {
    seg.editingRow = row;
    document.getElementById("seg-modal-textarea").value = row.translated_text || "";
    document.getElementById("seg-modal-overlay").classList.remove("hidden");
  }

  function segCloseEditModal() {
    seg.editingRow = null;
    document.getElementById("seg-modal-overlay").classList.add("hidden");
  }

  async function segSaveEdit() {
    if (!seg.editingRow) return;
    const newText = document.getElementById("seg-modal-textarea").value;
    try {
      const res = await fetch("/api/translations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_hash: seg.editingRow.source_hash,
          locale: seg.editingRow.locale,
          translated_text: newText,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      segCloseEditModal();
      await segLoadData();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  }

  async function segLogLinksToServer(row, e) {
    try {
      const res = await fetch("/api/log-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filepath: row.filepath,
          start_line: row.start_line,
          locale: row.locale,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const btn = e && e.target && e.target.closest(".log-links-btn");
      if (btn) {
        const origTitle = btn.title;
        btn.title = "Links logged to server console";
        setTimeout(() => {
          btn.title = origTitle;
        }, 2000);
      }
    } catch (err) {
      alert("Error logging links: " + err.message);
    }
  }

  async function segDeleteRow(row) {
    if (!confirm("Delete this translation?")) return;
    try {
      const sourceHashEnc = encodeURIComponent(row.source_hash);
      const localeEnc = encodeURIComponent(row.locale);
      const res = await fetch(`/api/translations/${sourceHashEnc}/${localeEnc}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await segLoadData();
      await segLoadFilepaths();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  }

  async function segDeleteFiltered() {
    const count = seg.total;
    if (count === 0) {
      alert("No entries to delete.");
      return;
    }
    if (!confirm(`Delete all ${count} filtered translation(s)?`)) return;
    try {
      const params = new URLSearchParams();
      if (seg.filters.filename) params.set("filename", seg.filters.filename);
      if (seg.filters.locale) params.set("locale", seg.filters.locale);
      if (seg.filters.model) params.set("model", seg.filters.model);
      if (seg.filters.source_hash) params.set("source_hash", seg.filters.source_hash);
      if (seg.filters.source_text) params.set("source_text", seg.filters.source_text);
      if (seg.filters.translated_text) params.set("translated_text", seg.filters.translated_text);
      if (seg.filters.last_hit === "stale") params.set("last_hit_at_null", "true");
      if (seg.filters.last_hit === "active") params.set("last_hit_at_not_null", "true");
      const qs = params.toString();
      const res = await fetch(`/api/translations/by-filters${qs ? "?" + qs : ""}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      alert(`Deleted ${data.deleted} translation(s).`);
      await segLoadData();
      await segLoadFilepaths();
      await segLoadLocales();
      await segLoadModels();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  }

  async function segDeleteByFilepath() {
    const filepath = document.getElementById("seg-select-filepath").value;
    if (!filepath) return;
    if (!confirm(`Delete all translations for "${filepath}"?`)) return;
    try {
      const res = await fetch(`/api/translations/by-filepath?filepath=${encodeURIComponent(filepath)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      alert(`Deleted ${data.deleted} translation(s).`);
      document.getElementById("seg-select-filepath").value = "";
      document.getElementById("seg-btn-delete-filepath").disabled = true;
      await segLoadData();
      await segLoadFilepaths();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  }

  async function segLoadLocales() {
    try {
      const res = await fetch("/api/locales");
      if (!res.ok) return;
      const data = await res.json();
      document.getElementById("seg-th-source-text").textContent = formatWithSourceLocale(
        "Source text",
        data.sourceLocale
      );
      const select = document.getElementById("seg-filter-locale");
      select.innerHTML = '<option value="">All locales</option>';
      for (const loc of data.locales) {
        const opt = document.createElement("option");
        opt.value = loc;
        opt.textContent = loc;
        select.appendChild(opt);
      }
    } catch (err) {
      console.error("Error loading locales:", err);
    }
  }

  async function segLoadModels() {
    try {
      const res = await fetch("/api/models");
      if (!res.ok) return;
      const data = await res.json();
      const select = document.getElementById("seg-filter-model");
      select.innerHTML = '<option value="">All models</option>';
      for (const model of data.models) {
        const opt = document.createElement("option");
        opt.value = model;
        opt.textContent = model;
        select.appendChild(opt);
      }
    } catch (err) {
      console.error("Error loading models:", err);
    }
  }

  function segApplyFilters() {
    seg.filters.filename = document.getElementById("seg-filter-filename").value.trim();
    segSyncFilterFilepathSelect();
    seg.filters.locale = document.getElementById("seg-filter-locale").value.trim();
    seg.filters.model = document.getElementById("seg-filter-model").value.trim();
    seg.filters.source_hash = document.getElementById("seg-filter-source-hash").value.trim();
    seg.filters.source_text = document.getElementById("seg-filter-source-text").value.trim();
    seg.filters.translated_text = document.getElementById("seg-filter-translated-text").value.trim();
    seg.filters.last_hit = document.getElementById("seg-filter-last-hit").value;
    seg.currentPage = 1;
    const applyBtn = document.getElementById("seg-btn-apply");
    if (applyBtn) {
      applyBtn.textContent = "Loading...";
      applyBtn.disabled = true;
    }
    segLoadData();
  }

  function segClearFilters() {
    document.getElementById("seg-filter-filename").value = "";
    document.getElementById("seg-filter-filepath-select").value = "";
    document.getElementById("seg-filter-locale").value = "";
    document.getElementById("seg-filter-model").value = "";
    document.getElementById("seg-filter-source-hash").value = "";
    document.getElementById("seg-filter-source-text").value = "";
    document.getElementById("seg-filter-translated-text").value = "";
    document.getElementById("seg-filter-last-hit").value = "";
    segApplyFilters();
  }

  function segInit() {
    document.getElementById("seg-btn-apply").addEventListener("click", segApplyFilters);
    document.getElementById("seg-btn-clear").addEventListener("click", segClearFilters);
    document.getElementById("seg-filter-filename").addEventListener("keydown", (e) => {
      if (e.key === "Enter") segApplyFilters();
    });
    document.getElementById("seg-filter-source-hash").addEventListener("keydown", (e) => {
      if (e.key === "Enter") segApplyFilters();
    });
    document.getElementById("seg-filter-source-text").addEventListener("keydown", (e) => {
      if (e.key === "Enter") segApplyFilters();
    });
    document.getElementById("seg-filter-translated-text").addEventListener("keydown", (e) => {
      if (e.key === "Enter") segApplyFilters();
    });
    document.getElementById("seg-filter-locale").addEventListener("change", segApplyFilters);
    document.getElementById("seg-filter-model").addEventListener("change", segApplyFilters);
    document.getElementById("seg-filter-last-hit").addEventListener("change", segApplyFilters);
    document.getElementById("seg-filter-filepath-select").addEventListener("change", (e) => {
      document.getElementById("seg-filter-filename").value = e.target.value;
      segApplyFilters();
    });

    document.getElementById("seg-select-filepath").addEventListener("change", (e) => {
      document.getElementById("seg-btn-delete-filepath").disabled = !e.target.value;
    });
    document.getElementById("seg-btn-delete-filepath").addEventListener("click", segDeleteByFilepath);
    document.getElementById("seg-btn-delete-filtered").addEventListener("click", segDeleteFiltered);

    function prev() {
      if (seg.currentPage > 1) {
        seg.currentPage--;
        segLoadData();
      }
    }
    function next() {
      if (seg.currentPage < Math.ceil(seg.total / seg.pageSize)) {
        seg.currentPage++;
        segLoadData();
      }
    }
    document.getElementById("seg-btn-prev").addEventListener("click", prev);
    document.getElementById("seg-btn-next").addEventListener("click", next);
    document.getElementById("seg-btn-prev-bottom").addEventListener("click", prev);
    document.getElementById("seg-btn-next-bottom").addEventListener("click", next);

    document.getElementById("seg-page-size").addEventListener("change", (e) => {
      seg.pageSize = parseInt(e.target.value, 10);
      seg.currentPage = 1;
      segLoadData();
    });

    document.getElementById("seg-btn-modal-cancel").addEventListener("click", segCloseEditModal);
    document.getElementById("seg-btn-modal-save").addEventListener("click", segSaveEdit);
    document.getElementById("seg-modal-overlay").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) segCloseEditModal();
    });

    seg.pageSize = parseInt(document.getElementById("seg-page-size").value, 10);
    segLoadData();
    segLoadFilepaths();
    segLoadLocales();
    segLoadModels();
  }

  // ---------- UI strings ----------
  const uiState = {
    meta: null,
    allEntries: [],
    /** One row per (entry × locale); each item is `{ entry, locale }`. */
    filteredRows: [],
    page: 1,
    editingEntry: null,
    editingLocale: null,
  };

  /** Selected locale filter, or empty string for "All locales". */
  function uiGetLocale() {
    const sel = document.getElementById("ui-edit-locale");
    return sel.value;
  }

  /** Locales to emit as table rows for one entry: filter picks one; otherwise all target locales (plus any extra keys in `translated`). */
  function uiLocalesForTableRows(entry) {
    const locFilter = uiGetLocale();
    if (locFilter) {
      return [locFilter];
    }
    const tl = (uiState.meta && uiState.meta.targetLocales) || [];
    const tr = entry.translated || {};
    const extra = Object.keys(tr).filter((k) => !tl.includes(k));
    extra.sort();
    if (tl.length) {
      return tl.concat(extra);
    }
    return Object.keys(tr).sort();
  }

  function uiCollectFilepaths(entries) {
    const set = new Set();
    for (const e of entries) {
      for (const loc of e.locations || []) {
        if (loc.file) set.add(loc.file);
      }
    }
    return Array.from(set).sort();
  }

  /** Unique non-empty model ids from `strings.json` entries (per-locale). */
  function uiCollectModels(entries) {
    const set = new Set();
    for (const e of entries) {
      const m = e.models || {};
      for (const v of Object.values(m)) {
        if (v != null && String(v).trim() !== "") set.add(String(v).trim());
      }
    }
    return Array.from(set).sort();
  }

  function uiFillFilepathSelect() {
    const sel = document.getElementById("ui-filter-filepath-select");
    const preserved = sel.value;
    const paths = uiCollectFilepaths(uiState.allEntries);
    sel.innerHTML = '<option value="">-- Select filepath --</option>';
    for (const fp of paths) {
      const opt = document.createElement("option");
      opt.value = fp;
      opt.textContent = fp;
      sel.appendChild(opt);
    }
    if (preserved && Array.from(sel.options).some((o) => o.value === preserved)) {
      sel.value = preserved;
    }
  }

  function uiFillModelSelect() {
    const sel = document.getElementById("ui-filter-model");
    const preserved = sel.value;
    const models = uiCollectModels(uiState.allEntries);
    sel.innerHTML = '<option value="">All models</option>';
    for (const model of models) {
      const opt = document.createElement("option");
      opt.value = model;
      opt.textContent = model;
      sel.appendChild(opt);
    }
    if (preserved && Array.from(sel.options).some((o) => o.value === preserved)) {
      sel.value = preserved;
    }
  }

  /** Keep filepath select aligned when filename exactly matches a known path. */
  function uiSyncFilterFilepathSelect() {
    const fn = document.getElementById("ui-filter-filename").value.trim();
    const sel = document.getElementById("ui-filter-filepath-select");
    if (!fn || !Array.from(sel.options).some((o) => o.value === fn)) {
      sel.value = "";
    } else {
      sel.value = fn;
    }
  }

  function uiApplyFiltersToList() {
    uiSyncFilterFilepathSelect();
    const idQ = document.getElementById("ui-filter-id").value.trim().toLowerCase();
    const filenamePartial = document.getElementById("ui-filter-filename").value.trim().toLowerCase();
    const filepathSel = document.getElementById("ui-filter-filepath-select").value;
    const srcQ = document.getElementById("ui-filter-source").value.trim().toLowerCase();
    const trQ = document.getElementById("ui-filter-translated").value.trim().toLowerCase();
    const modelQ = document.getElementById("ui-filter-model").value.trim();
    const rows = [];
    for (const e of uiState.allEntries) {
      if (idQ && !String(e.id).toLowerCase().includes(idQ)) continue;
      if (filepathSel) {
        const files = (e.locations || []).map((l) => l.file).filter(Boolean);
        if (!files.some((f) => f === filepathSel)) continue;
      }
      if (filenamePartial) {
        const files = (e.locations || []).map((l) => l.file).filter(Boolean);
        if (!files.some((f) => f.toLowerCase().includes(filenamePartial))) continue;
      }
      if (srcQ && !(e.source || "").toLowerCase().includes(srcQ)) continue;
      for (const locale of uiLocalesForTableRows(e)) {
        const t = ((e.translated || {})[locale] != null ? String((e.translated || {})[locale]) : "").toLowerCase();
        if (trQ && !t.includes(trQ)) continue;
        if (modelQ) {
          const rowModel = (e.models || {})[locale];
          const rowModelStr = rowModel != null && String(rowModel).trim() !== "" ? String(rowModel).trim() : "";
          if (rowModelStr !== modelQ) continue;
        }
        rows.push({ entry: e, locale });
      }
    }
    uiState.filteredRows = rows;
    uiState.page = 1;
  }

  function uiFormatLocations(locs) {
    if (!locs || !locs.length) return "\u2014";
    return locs.map((l) => `${l.file}:${l.line}`).join("; ");
  }

  function uiRenderTable() {
    const tbody = document.getElementById("ui-table-body");
    tbody.innerHTML = "";
    const total = uiState.filteredRows.length;
    const showPag = total > UI_PAGE_SIZE;
    document.getElementById("ui-pagination-wrap-top").classList.toggle("hidden-ui", !showPag);
    document.getElementById("ui-pagination-wrap-bottom").classList.toggle("hidden-ui", !showPag);

    const totalPages = Math.max(1, Math.ceil(total / UI_PAGE_SIZE) || 1);
    const page = Math.min(uiState.page, totalPages);
    uiState.page = page;
    const start = (page - 1) * UI_PAGE_SIZE;
    const slice = showPag ? uiState.filteredRows.slice(start, start + UI_PAGE_SIZE) : uiState.filteredRows;

    if (showPag) {
      const info = `Showing ${total ? start + 1 : 0}\u2013${Math.min(start + UI_PAGE_SIZE, total)} of ${total}`;
      document.getElementById("ui-pagination-info").textContent = info;
      document.getElementById("ui-pagination-info-bottom").textContent = info;
      const pi = `Page ${page} of ${totalPages}`;
      document.getElementById("ui-page-indicator").textContent = pi;
      document.getElementById("ui-page-indicator-bottom").textContent = pi;
      document.getElementById("ui-btn-prev").disabled = page <= 1;
      document.getElementById("ui-btn-next").disabled = page >= totalPages;
      document.getElementById("ui-btn-prev-bottom").disabled = page <= 1;
      document.getElementById("ui-btn-next-bottom").disabled = page >= totalPages;
    }

    for (const { entry: e, locale: rowLocale } of slice) {
      const tr = document.createElement("tr");
      const t = (e.translated || {})[rowLocale] != null ? String((e.translated || {})[rowLocale]) : "";
      const modelLabel =
        (e.models || {})[rowLocale] != null && String((e.models || {})[rowLocale]).trim() !== ""
          ? String((e.models || {})[rowLocale])
          : "\u2014";
      tr.innerHTML = `
        <td><code>${escapeHtml(e.id)}</code></td>
        <td title="${escapeHtml(uiFormatLocations(e.locations))}">${escapeHtml(truncate(uiFormatLocations(e.locations), 80))}</td>
        <td class="source-text">${escapeHtml(truncate(e.source, 200))}</td>
        <td>${escapeHtml(rowLocale)}</td>
        <td>${escapeHtml(truncate(t, 120))}</td>
        <td title="${escapeHtml(modelLabel)}">${escapeHtml(truncate(modelLabel, 48))}</td>
        <td class="actions"></td>
      `;
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-btn";
      editBtn.title = "Edit";
      editBtn.textContent = "\u270F\uFE0F";
      editBtn.addEventListener("click", () => uiOpenModal(e, rowLocale));
      const logBtn = document.createElement("button");
      logBtn.type = "button";
      logBtn.className = "icon-btn log-links-btn";
      logBtn.title = "Log file links to server console";
      logBtn.textContent = "\uD83D\uDD17";
      logBtn.addEventListener("click", (ev) => uiLogLinks(e, rowLocale, ev));
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "icon-btn delete-btn";
      deleteBtn.title = "Delete";
      deleteBtn.textContent = "\u274C";
      deleteBtn.addEventListener("click", () => uiDeleteRow(e, rowLocale));
      tr.querySelector(".actions").append(editBtn, logBtn, deleteBtn);
      tbody.appendChild(tr);
    }
  }

  function uiOpenModal(entry, locale) {
    uiState.editingEntry = entry;
    uiState.editingLocale = locale;
    document.getElementById("ui-modal-textarea").value = (entry.translated && entry.translated[locale]) || "";
    const modal = document.querySelector("#ui-modal-overlay .modal h2");
    if (modal) {
      modal.textContent = `Edit UI translation (${locale})`;
    }
    document.getElementById("ui-modal-overlay").classList.remove("hidden");
  }

  function uiCloseModal() {
    uiState.editingEntry = null;
    uiState.editingLocale = null;
    document.getElementById("ui-modal-overlay").classList.add("hidden");
    const modalH2 = document.querySelector("#ui-modal-overlay .modal h2");
    if (modalH2) modalH2.textContent = "Edit UI translation";
  }

  async function uiSaveModal() {
    if (!uiState.editingEntry || uiState.editingLocale == null) return;
    const loc = uiState.editingLocale;
    const val = document.getElementById("ui-modal-textarea").value;
    try {
      const res = await fetch(`/api/ui-strings/${encodeURIComponent(uiState.editingEntry.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translated: { [loc]: val } }),
      });
      const pj = await res.json();
      if (!res.ok) throw new Error(pj.error || res.statusText);
      uiCloseModal();
      await loadUiStrings();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  }

  async function uiDeleteRow(entry, locale) {
    if (!confirm("Delete this translation?")) return;
    try {
      const res = await fetch(`/api/ui-strings/${encodeURIComponent(entry.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const pj = await res.json();
      if (!res.ok) throw new Error(pj.error || res.statusText);
      await loadUiStrings();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  }

  async function uiDeleteFiltered() {
    const count = uiState.filteredRows.length;
    if (count === 0) {
      alert("No rows to delete.");
      return;
    }
    if (!confirm(`Delete all ${count} filtered translation row(s)?`)) return;
    try {
      const res = await fetch("/api/ui-strings/delete-rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: uiState.filteredRows.map((r) => ({ id: r.entry.id, locale: r.locale })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      alert(`Deleted ${data.deleted} translation(s).`);
      await loadUiStrings();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  }

  async function uiLogLinks(entry, rowLocale, e) {
    try {
      const res = await fetch("/api/ui-log-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations: (entry.locations || []).map((l) => ({ filepath: l.file, line: l.line })),
          locale: rowLocale != null ? rowLocale : uiGetLocale() || "(all)",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const btn = e && e.target && e.target.closest(".log-links-btn");
      if (btn) {
        const o = btn.title;
        btn.title = "Logged to server console";
        setTimeout(() => {
          btn.title = o;
        }, 2000);
      }
    } catch (err) {
      alert("Error logging links: " + err.message);
    }
  }

  async function loadUiStrings() {
    setStatus(document.getElementById("ui-status"), "Loading\u2026", false);
    try {
      const meta = await fetch("/api/ui-strings/meta").then((r) => r.json());
      uiState.meta = meta;
      document.getElementById("ui-meta").textContent = meta.available
        ? `File: ${meta.path || "(unknown)"} \u2014 locales: ${(meta.targetLocales || []).join(", ")}`
        : "UI strings path not configured or file missing.";
      document.getElementById("ui-th-source").textContent = formatWithSourceLocale("Source", meta.sourceLocale);
      const localeSel = document.getElementById("ui-edit-locale");
      const prevLocale = localeSel.value;
      localeSel.innerHTML = "";
      const allOpt = document.createElement("option");
      allOpt.value = "";
      allOpt.textContent = "All locales";
      localeSel.appendChild(allOpt);
      for (const loc of meta.targetLocales || []) {
        const opt = document.createElement("option");
        opt.value = loc;
        opt.textContent = loc;
        localeSel.appendChild(opt);
      }
      const hasPrev = prevLocale === "" || Array.from(localeSel.options).some((o) => o.value === prevLocale);
      localeSel.value = hasPrev ? prevLocale : "";
      if (!meta.available) {
        setStatus(document.getElementById("ui-status"), "Unavailable", false);
        document.getElementById("ui-table-body").innerHTML = "";
        document.getElementById("ui-filter-filename").value = "";
        const fpSel = document.getElementById("ui-filter-filepath-select");
        fpSel.innerHTML = '<option value="">-- Select filepath --</option>';
        fpSel.value = "";
        const modelSel = document.getElementById("ui-filter-model");
        modelSel.innerHTML = '<option value="">All models</option>';
        modelSel.value = "";
        return;
      }
      const data = await fetch("/api/ui-strings").then((r) => r.json());
      if (!data.entries) throw new Error(data.error || "Bad response");
      uiState.allEntries = data.entries.map((e) => ({
        id: e.id,
        source: e.source,
        translated: e.translated || {},
        models: e.models || {},
        locations: e.locations || [],
      }));
      uiFillFilepathSelect();
      uiFillModelSelect();
      uiApplyFiltersToList();
      uiRenderTable();
      setStatus(
        document.getElementById("ui-status"),
        `${uiState.allEntries.length} entries (${uiState.filteredRows.length} row(s) after filter)`,
        true
      );
    } catch (e) {
      setStatus(document.getElementById("ui-status"), String(e.message || e), false);
    }
  }

  function uiClearFilters() {
    document.getElementById("ui-filter-id").value = "";
    document.getElementById("ui-filter-filename").value = "";
    document.getElementById("ui-filter-filepath-select").value = "";
    document.getElementById("ui-filter-source").value = "";
    document.getElementById("ui-filter-translated").value = "";
    document.getElementById("ui-filter-model").value = "";
    document.getElementById("ui-edit-locale").value = "";
    uiApplyFiltersToList();
    uiRenderTable();
    setStatus(
      document.getElementById("ui-status"),
      `${uiState.allEntries.length} entries (${uiState.filteredRows.length} row(s) after filter)`,
      true
    );
  }

  function uiApplyAndRender() {
    uiApplyFiltersToList();
    uiRenderTable();
    setStatus(
      document.getElementById("ui-status"),
      `${uiState.allEntries.length} entries (${uiState.filteredRows.length} row(s) after filter)`,
      true
    );
  }

  function uiInitListeners() {
    document.getElementById("ui-btn-delete-filtered").addEventListener("click", uiDeleteFiltered);
    document.getElementById("ui-btn-clear").addEventListener("click", uiClearFilters);
    document.getElementById("ui-btn-apply").addEventListener("click", uiApplyAndRender);
    function uiApplyFiltersOnEnter(e) {
      if (e.key === "Enter") {
        uiApplyAndRender();
      }
    }
    document.getElementById("ui-filter-id").addEventListener("keydown", uiApplyFiltersOnEnter);
    document.getElementById("ui-filter-filename").addEventListener("keydown", uiApplyFiltersOnEnter);
    document.getElementById("ui-filter-source").addEventListener("keydown", uiApplyFiltersOnEnter);
    document.getElementById("ui-filter-translated").addEventListener("keydown", uiApplyFiltersOnEnter);
    document.getElementById("ui-edit-locale").addEventListener("change", uiApplyAndRender);
    document.getElementById("ui-filter-filepath-select").addEventListener("change", (e) => {
      document.getElementById("ui-filter-filename").value = e.target.value;
      uiApplyAndRender();
    });
    document.getElementById("ui-filter-model").addEventListener("change", uiApplyAndRender);
    function uiPrev() {
      if (uiState.page > 1) {
        uiState.page--;
        uiRenderTable();
      }
    }
    function uiNext() {
      const totalPages = Math.max(1, Math.ceil(uiState.filteredRows.length / UI_PAGE_SIZE));
      if (uiState.page < totalPages) {
        uiState.page++;
        uiRenderTable();
      }
    }
    document.getElementById("ui-btn-prev").addEventListener("click", uiPrev);
    document.getElementById("ui-btn-next").addEventListener("click", uiNext);
    document.getElementById("ui-btn-prev-bottom").addEventListener("click", uiPrev);
    document.getElementById("ui-btn-next-bottom").addEventListener("click", uiNext);
    document.getElementById("ui-btn-modal-cancel").addEventListener("click", uiCloseModal);
    document.getElementById("ui-btn-modal-save").addEventListener("click", uiSaveModal);
    document.getElementById("ui-modal-overlay").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) uiCloseModal();
    });
  }

  // ---------- Glossary ----------
  const glState = {
    meta: null,
    rows: [],
    filtered: [],
    page: 1,
  };

  function glFillLocaleSelect(selectEl) {
    selectEl.innerHTML = "";
    const tl = (glState.meta && glState.meta.targetLocales) || [];
    for (const loc of tl) {
      const opt = document.createElement("option");
      opt.value = loc;
      opt.textContent = loc;
      selectEl.appendChild(opt);
    }
    const star = document.createElement("option");
    star.value = "*";
    star.textContent = "All locales (*)";
    selectEl.appendChild(star);
  }

  function glApplyFilters() {
    const oQ = document.getElementById("gl-filter-original").value.trim().toLowerCase();
    const localeRaw = document.getElementById("gl-filter-locale").value.trim().toLowerCase();
    const lQ = localeRaw === "*" ? "" : localeRaw;
    const tQ = document.getElementById("gl-filter-translation").value.trim().toLowerCase();
    glState.filtered = glState.rows.filter((r) => {
      const o = (r["Original language string"] || "").toLowerCase();
      const loc = (r.locale || "").toLowerCase();
      const tr = (r.Translation || "").toLowerCase();
      if (oQ && !o.includes(oQ)) return false;
      if (lQ && loc !== lQ) return false;
      if (tQ && !tr.includes(tQ)) return false;
      return true;
    });
    glState.page = 1;
  }

  function glRenderTable() {
    const tbody = document.getElementById("gl-table-body");
    tbody.innerHTML = "";
    const total = glState.filtered.length;
    const showPag = total > GL_PAGE_SIZE;
    document.getElementById("gl-pagination-wrap-top").classList.toggle("hidden-ui", !showPag);
    document.getElementById("gl-pagination-wrap-bottom").classList.toggle("hidden-ui", !showPag);
    const totalPages = Math.max(1, Math.ceil(total / GL_PAGE_SIZE) || 1);
    glState.page = Math.min(glState.page, totalPages);
    const page = glState.page;
    const start = (page - 1) * GL_PAGE_SIZE;
    const slice = showPag ? glState.filtered.slice(start, start + GL_PAGE_SIZE) : glState.filtered;

    if (showPag) {
      const info = `Showing ${total ? start + 1 : 0}\u2013${Math.min(start + GL_PAGE_SIZE, total)} of ${total}`;
      document.getElementById("gl-pagination-info").textContent = info;
      document.getElementById("gl-pagination-info-bottom").textContent = info;
      const pi = `Page ${page} of ${totalPages}`;
      document.getElementById("gl-page-indicator").textContent = pi;
      document.getElementById("gl-page-indicator-bottom").textContent = pi;
      document.getElementById("gl-btn-prev").disabled = page <= 1;
      document.getElementById("gl-btn-next").disabled = page >= totalPages;
      document.getElementById("gl-btn-prev-bottom").disabled = page <= 1;
      document.getElementById("gl-btn-next-bottom").disabled = page >= totalPages;
    }

    for (const r of slice) {
      const tr = document.createElement("tr");
      const orig = r["Original language string"] ?? "";
      const loc = r.locale ?? "";
      const trn = r.Translation ?? "";
      const idx = r.rowIndex;

      const tdO = document.createElement("td");
      const inpO = document.createElement("input");
      inpO.type = "text";
      inpO.dataset.field = "orig";
      inpO.value = orig;
      tdO.appendChild(inpO);

      const tdL = document.createElement("td");
      const locSel = document.createElement("select");
      locSel.dataset.field = "locale";
      glFillLocaleSelect(locSel);
      if (loc && !tlHas(loc, locSel)) {
        const opt = document.createElement("option");
        opt.value = loc;
        opt.textContent = loc;
        locSel.insertBefore(opt, locSel.firstChild);
      }
      locSel.value = loc ? loc : "*";
      tdL.appendChild(locSel);

      const tdT = document.createElement("td");
      const inpT = document.createElement("input");
      inpT.type = "text";
      inpT.dataset.field = "tr";
      inpT.value = trn;
      tdT.appendChild(inpT);

      const tdA = document.createElement("td");
      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "btn-small";
      saveBtn.textContent = "✅ Save";
      saveBtn.addEventListener("click", () => glSaveRow(tr, idx));
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-small btn-delete";
      delBtn.textContent = "❌ Delete";
      delBtn.addEventListener("click", () => glDeleteRow(idx));
      tdA.append(saveBtn, delBtn);

      tr.append(tdO, tdL, tdT, tdA);
      tbody.appendChild(tr);
    }
  }

  function tlHas(loc, sel) {
    return Array.from(sel.options).some((o) => o.value === loc);
  }

  async function glSaveRow(tr, rowIndex) {
    const orig = tr.querySelector('[data-field="orig"]').value;
    const locale = tr.querySelector('[data-field="locale"]').value;
    const translation = tr.querySelector('[data-field="tr"]').value;
    try {
      const res = await fetch(`/api/glossary-user/${rowIndex}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: orig, locale, translation }),
      });
      const pj = await res.json();
      if (!res.ok) throw new Error(pj.error || res.statusText);
      await loadGlossary();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  }

  async function glDeleteRow(rowIndex) {
    if (!confirm("Delete this glossary row?")) return;
    try {
      const res = await fetch(`/api/glossary-user/${rowIndex}`, { method: "DELETE" });
      const pj = await res.json();
      if (!res.ok) throw new Error(pj.error || res.statusText);
      await loadGlossary();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  }

  async function loadGlossary() {
    setStatus(document.getElementById("gl-status"), "Loading\u2026", false);
    try {
      const meta = await fetch("/api/glossary-user/meta").then((r) => r.json());
      glState.meta = meta;
      document.getElementById("gl-meta").textContent = meta.available
        ? `File: ${meta.path || "(path)"} \u2014 target locales: ${(meta.targetLocales || []).join(", ")}`
        : "glossary.userGlossary not configured.";
      document.getElementById("gl-th-original").textContent = formatWithSourceLocale("Original", meta.sourceLocale);
      const glNewLocale = document.getElementById("gl-new-locale");
      glFillLocaleSelect(glNewLocale);
      glNewLocale.value = "*";
      const glFilterLocale = document.getElementById("gl-filter-locale");
      const prevGlFilterLocale = glFilterLocale.value;
      glFillLocaleSelect(glFilterLocale);
      glFilterLocale.value =
        prevGlFilterLocale && tlHas(prevGlFilterLocale, glFilterLocale) ? prevGlFilterLocale : "*";
      if (!meta.available) {
        setStatus(document.getElementById("gl-status"), "No glossary path", false);
        document.getElementById("gl-table-body").innerHTML = "";
        return;
      }
      const data = await fetch("/api/glossary-user").then((r) => r.json());
      glState.rows = data.rows || [];
      glApplyFilters();
      glRenderTable();
      setStatus(document.getElementById("gl-status"), `${glState.rows.length} row(s)`, true);
    } catch (e) {
      setStatus(document.getElementById("gl-status"), String(e.message || e), false);
    }
  }

  function glInitListeners() {
    document.getElementById("gl-btn-add").addEventListener("click", async () => {
      const original = document.getElementById("gl-new-original").value.trim();
      const locale = document.getElementById("gl-new-locale").value;
      const translation = document.getElementById("gl-new-translation").value;
      if (!original || locale === "") {
        setStatus(document.getElementById("gl-status"), "Original and locale required", false);
        return;
      }
      const pr = await fetch("/api/glossary-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, locale, translation }),
      });
      const pj = await pr.json();
      setStatus(document.getElementById("gl-status"), pr.ok ? "Added." : pj.error, pr.ok);
      if (pr.ok) {
        document.getElementById("gl-new-original").value = "";
        document.getElementById("gl-new-translation").value = "";
        await loadGlossary();
      }
    });
    function glClearFilters() {
      document.getElementById("gl-filter-original").value = "";
      document.getElementById("gl-filter-locale").value = "*";
      document.getElementById("gl-filter-translation").value = "";
      glApplyFilters();
      glRenderTable();
      setStatus(
        document.getElementById("gl-status"),
        `${glState.rows.length} rows (${glState.filtered.length} after filter)`,
        true
      );
    }
    document.getElementById("gl-btn-clear").addEventListener("click", glClearFilters);
    function glRunAppliedFilters() {
      glApplyFilters();
      glRenderTable();
      setStatus(
        document.getElementById("gl-status"),
        `${glState.rows.length} rows (${glState.filtered.length} after filter)`,
        true
      );
    }
    document.getElementById("gl-btn-apply").addEventListener("click", glRunAppliedFilters);
    function glFilterFieldKeydown(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        glRunAppliedFilters();
      }
    }
    document.getElementById("gl-filter-original").addEventListener("keydown", glFilterFieldKeydown);
    document.getElementById("gl-filter-translation").addEventListener("keydown", glFilterFieldKeydown);
    document.getElementById("gl-filter-locale").addEventListener("change", glRunAppliedFilters);
    function glPrev() {
      if (glState.page > 1) {
        glState.page--;
        glRenderTable();
      }
    }
    function glNext() {
      const totalPages = Math.max(1, Math.ceil(glState.filtered.length / GL_PAGE_SIZE));
      if (glState.page < totalPages) {
        glState.page++;
        glRenderTable();
      }
    }
    document.getElementById("gl-btn-prev").addEventListener("click", glPrev);
    document.getElementById("gl-btn-next").addEventListener("click", glNext);
    document.getElementById("gl-btn-prev-bottom").addEventListener("click", glPrev);
    document.getElementById("gl-btn-next-bottom").addEventListener("click", glNext);
  }

  function loadStats() {
    const statusEl = document.getElementById("stats-status");
    const contentEl = document.getElementById("stats-content");
    setStatus(statusEl, "Loading statistics...", false);
    contentEl.innerHTML = "";

    function pct(translated, total) {
      if (total === 0) return "100.0";
      return ((100 * translated) / total).toFixed(1);
    }

    function pctPart(count, total) {
      if (total === 0) return "—";
      return ((100 * count) / total).toFixed(1);
    }

    function renderModelLocaleMatrix(byModel, byLocale, byModelLocale, isUi) {
      if (!byModel || byModel.length === 0 || !byLocale || byLocale.length === 0 || !byModelLocale) return "";
      const locales = byLocale.map((r) => r.locale);
      let mHtml = '<h4 class="stats-subtitle">By model and locale</h4>';
      mHtml += '<div style="overflow-x:auto; padding-bottom: 0.5rem;"><table class="stats-table" style="max-width:none;"><thead><tr><th>Model</th>';
      for (const loc of locales) {
        mHtml += `<th>${escapeHtml(loc)}</th>`;
      }
      mHtml += '</tr></thead><tbody>';

      const map = {};
      for (const r of byModelLocale) {
        map[`${r.model}\0${r.locale}`] = r.count;
      }

      const locTotals = {};
      for (const r of byLocale) {
        locTotals[r.locale] = isUi ? r.translated : r.total;
      }

      for (const mRow of byModel) {
        mHtml += `<tr><td>${escapeHtml(mRow.model)}</td>`;
        for (const loc of locales) {
          const count = map[`${mRow.model}\0${loc}`] || 0;
          const totalForLoc = locTotals[loc] || 0;
          if (count === 0) {
            mHtml += '<td style="color: var(--text-secondary); text-align: center;">&mdash;</td>';
          } else {
            const pct = pctPart(count, totalForLoc);
            mHtml += `<td>${count} <span style="color: var(--text-secondary); font-size: 0.85em;">(${pct}%)</span></td>`;
          }
        }
        mHtml += '</tr>';
      }
      mHtml += '</tbody></table></div>';
      return mHtml;
    }

    fetch("/api/stats")
      .then((r) => {
        if (!r.ok) return r.text().then((t) => Promise.reject(new Error(t || r.statusText)));
        return r.json();
      })
      .then((data) => {
        setStatus(statusEl, "Statistics loaded.", true);
        const c = data.cache;
        const ui = data.uiStrings;
        const gl = data.glossary;

        let html = "";
        html += '<div class="stats-grid"><div class="stats-column">';
        
        html += '<div class="stats-section"><h3 class="stats-section-title">Documentation cache</h3>';
        html += '<div class="stats-cards">';
        html += `<div class="stats-card"><span class="stats-card-value">${c.totalSegments}</span><span class="stats-card-label">Total segments</span></div>`;
        html += `<div class="stats-card"><span class="stats-card-value">${c.staleSegments}</span><span class="stats-card-label">Stale</span></div>`;
        html += `<div class="stats-card"><span class="stats-card-value">${c.activeSegments}</span><span class="stats-card-label">Active</span></div>`;
        html += `<div class="stats-card"><span class="stats-card-value">${c.totalFiles}</span><span class="stats-card-label">Tracked files</span></div>`;
        html += `<div class="stats-card"><span class="stats-card-value">${c.uniqueFilepaths}</span><span class="stats-card-label">Unique filepaths</span></div>`;
        html += `<div class="stats-card"><span class="stats-card-value">${c.byModel.length}</span><span class="stats-card-label">Models used</span></div>`;
        html += `<div class="stats-card"><span class="stats-card-value">${gl.available ? gl.totalTerms : 0}</span><span class="stats-card-label">Glossary entries</span></div>`;
        html += "</div>";

        html +=
          '<table class="stats-table"><thead><tr><th>Locale</th><th>Segments</th><th>Stale</th><th>Active</th></tr></thead><tbody>';
        for (const row of c.byLocale) {
          html += `<tr><td>${escapeHtml(row.locale)}</td><td>${row.total}</td><td>${row.stale}</td><td>${row.active}</td></tr>`;
        }
        html += "</tbody></table>";

        html +=
          '<h4 class="stats-subtitle">By model</h4><table class="stats-table"><thead><tr><th>Model</th><th>Segments</th><th>% of total</th></tr></thead><tbody>';
        for (const row of c.byModel) {
          const p = pctPart(row.count, c.totalSegments);
          html += `<tr><td>${escapeHtml(row.model)}</td><td>${row.count}</td><td>${p === "—" ? p : `${p}%`}</td></tr>`;
        }
        html += "</tbody>";
        html += `<tfoot><tr class="stats-table-total"><th scope="row">Total</th><td>${c.totalSegments}</td><td>${
          c.totalSegments === 0 ? "—" : "100.0%"
        }</td></tr></tfoot></table>`;
        
        html += renderModelLocaleMatrix(c.byModel, c.byLocale, c.byModelLocale, false);
        
        html += '</div>';

        html += '</div><div class="stats-column">';

        html += '<div class="stats-section"><h3 class="stats-section-title">UI strings (strings.json)</h3>';
        if (!ui.available) {
          html += '<p class="hint stats-unavailable">strings.json not configured or missing.</p>';
        } else {
          html += `<p class="hint">${ui.totalEntries} entries</p>`;
          html +=
            '<table class="stats-table"><thead><tr><th>Locale</th><th>Translated</th><th>Missing</th><th>Coverage</th></tr></thead><tbody>';
          for (const row of ui.byLocale) {
            const cov = pct(row.translated, ui.totalEntries);
            html += `<tr><td>${escapeHtml(row.locale)}</td><td>${row.translated}</td><td>${row.missing}</td><td>${cov}%</td></tr>`;
          }
          html += "</tbody></table>";

          const totalUiModelUsage = ui.byModel.reduce((sum, r) => sum + r.count, 0);
          html +=
            '<h4 class="stats-subtitle">By model</h4><table class="stats-table"><thead><tr><th>Model</th><th>Entries</th><th>% of total</th></tr></thead><tbody>';
          for (const row of ui.byModel) {
            const p = pctPart(row.count, totalUiModelUsage);
            html += `<tr><td>${escapeHtml(row.model)}</td><td>${row.count}</td><td>${p === "—" ? p : `${p}%`}</td></tr>`;
          }
          html += "</tbody>";
          html += `<tfoot><tr class="stats-table-total"><th scope="row">Total</th><td>${totalUiModelUsage}</td><td>${
            totalUiModelUsage === 0 ? "—" : "100.0%"
          }</td></tr></tfoot></table>`;
          
          html += renderModelLocaleMatrix(ui.byModel, ui.byLocale, ui.byModelLocale, true);
        }
        html += "</div>";

        html += "</div></div>";

        contentEl.innerHTML = html;
      })
      .catch((err) => {
        setStatus(statusEl, String(err.message || err), false);
      });
  }

  // ---------- Tabs ----------
  document.querySelectorAll(".tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tabs button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`panel-${tab}`).classList.add("active");
      if (tab === "ui") loadUiStrings();
      if (tab === "glossary") loadGlossary();
      if (tab === "stats") loadStats();
    });
  });

  segInit();
  uiInitListeners();
  glInitListeners();

})();
