/* global fetch, document */

function $(id) {
  return document.getElementById(id);
}

function setStatus(el, msg, ok) {
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = ok ? "#3fb950" : "#d29922";
}

document.querySelectorAll(".tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.getAttribute("data-tab");
    document.querySelectorAll(".tabs button").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`panel-${tab}`).classList.add("active");
    if (tab === "ui") loadUiStrings();
    if (tab === "glossary") loadGlossary();
  });
});

async function loadSegments() {
  const locale = $("seg-locale").value.trim();
  const filename = $("seg-file").value.trim();
  const q = new URLSearchParams();
  if (locale) q.set("locale", locale);
  if (filename) q.set("filename", filename);
  q.set("page", "1");
  q.set("pageSize", "50");
  setStatus($("seg-status"), "Loading…");
  try {
    const res = await fetch(`/api/translations?${q}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    const tbody = $("seg-body");
    tbody.innerHTML = "";
    for (const r of data.rows || []) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td><code>${escapeHtml(r.source_hash)}</code></td><td>${escapeHtml(r.locale)}</td><td>${escapeHtml((r.source_text || "").slice(0, 120))}</td><td><textarea data-hash="${escapeAttr(r.source_hash)}" data-locale="${escapeAttr(r.locale)}">${escapeHtml(r.translated_text || "")}</textarea></td><td><button type="button" class="small seg-save">Save</button></td>`;
      tbody.appendChild(tr);
    }
    tbody.querySelectorAll(".seg-save").forEach((b) => {
      b.addEventListener("click", async (ev) => {
        const tr = ev.target.closest("tr");
        const ta = tr.querySelector("textarea");
        const body = {
          source_hash: ta.dataset.hash,
          locale: ta.dataset.locale,
          translated_text: ta.value,
        };
        const pr = await fetch("/api/translations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const pj = await pr.json();
        setStatus($("seg-status"), pr.ok ? "Saved." : pj.error, pr.ok);
      });
    });
    setStatus($("seg-status"), `${data.total} row(s)`, true);
  } catch (e) {
    setStatus($("seg-status"), String(e.message || e), false);
  }
}

$("seg-load").addEventListener("click", loadSegments);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}

async function loadUiStrings() {
  setStatus($("ui-status"), "Loading…");
  try {
    const meta = await fetch("/api/ui-strings/meta").then((r) => r.json());
    $("ui-meta").textContent = meta.available
      ? `File: ${meta.path || "(unknown)"} — locales: ${(meta.targetLocales || []).join(", ")}`
      : "UI strings path not configured or file missing.";
    if (!meta.available) {
      setStatus($("ui-status"), "Unavailable", false);
      $("ui-body").innerHTML = "";
      return;
    }
    const data = await fetch("/api/ui-strings").then((r) => r.json());
    if (!data.entries) throw new Error(data.error || "Bad response");
    const tbody = $("ui-body");
    tbody.innerHTML = "";
    const loc = (meta.targetLocales && meta.targetLocales[0]) || "en";
    $("ui-locale-head").textContent = `translated (${loc})`;
    for (const e of data.entries) {
      const tr = document.createElement("tr");
      const t = (e.translated && e.translated[loc]) || "";
      tr.innerHTML = `<td><code>${escapeHtml(e.id)}</code></td><td>${escapeHtml(e.source)}</td><td><textarea data-id="${escapeAttr(e.id)}">${escapeHtml(t)}</textarea><br/><button type="button" class="small ui-save">Save</button></td>`;
      tbody.appendChild(tr);
    }
    tbody.querySelectorAll(".ui-save").forEach((b) => {
      b.addEventListener("click", async (ev) => {
        const tr = ev.target.closest("tr");
        const ta = tr.querySelector("textarea");
        const id = ta.dataset.id;
        const pr = await fetch(`/api/ui-strings/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translated: { [loc]: ta.value } }),
        });
        const pj = await pr.json();
        setStatus($("ui-status"), pr.ok ? "Saved." : pj.error, pr.ok);
      });
    });
    setStatus($("ui-status"), `${data.entries.length} entries`, true);
  } catch (e) {
    setStatus($("ui-status"), String(e.message || e), false);
  }
}

async function loadGlossary() {
  setStatus($("gl-status"), "Loading…");
  try {
    const meta = await fetch("/api/glossary-user/meta").then((r) => r.json());
    $("gl-meta").textContent = meta.available
      ? `File: ${meta.path || "(path)"}`
      : "glossary.userGlossary not configured.";
    const data = await fetch("/api/glossary-user").then((r) => r.json());
    const tbody = $("gl-body");
    tbody.innerHTML = "";
    for (const r of data.rows || []) {
      const o = r["Original language string"] || r["en"] || "";
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(o)}</td><td>${escapeHtml(r["locale"] || "")}</td><td>${escapeHtml(r["Translation"] || r["translation"] || "")}</td>`;
      tbody.appendChild(tr);
    }
    setStatus($("gl-status"), `${(data.rows || []).length} row(s)`, true);
  } catch (e) {
    setStatus($("gl-status"), String(e.message || e), false);
  }
}

$("gl-add").addEventListener("click", async () => {
  const original = $("gl-original").value.trim();
  const locale = $("gl-locale").value.trim();
  const translation = $("gl-translation").value;
  if (!original || !locale) {
    setStatus($("gl-status"), "original and locale required", false);
    return;
  }
  const pr = await fetch("/api/glossary-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ original, locale, translation }),
  });
  const pj = await pr.json();
  setStatus($("gl-status"), pr.ok ? "Added." : pj.error, pr.ok);
  if (pr.ok) loadGlossary();
});

loadSegments();
