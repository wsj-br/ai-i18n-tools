/* global document, window, localStorage, fetch, URLSearchParams, URL */
(function () {
  "use strict";

  const SOURCE_LOCALE = "en";
  const LOCALE_STORAGE_KEY = "plain-html-demo-locale";

  const I18N = { locale: SOURCE_LOCALE, dir: "ltr", bundle: {} };
  let languages = [];

  /**
   * Collapse insignificant whitespace so a multi-line / indented source text node yields the same key
   * the extractor computed. MUST stay identical to `normalizeI18nText` in
   * `src/extractors/html-i18n-marks.ts` (and the bundled dashboard's `applyStaticI18n`).
   */
  function normalizeI18nText(s) {
    return s.trim().replace(/\s+/g, " ");
  }

  function t(key) {
    const raw = I18N.bundle[key];
    return typeof raw === "string" && raw.length > 0 ? raw : key;
  }

  function applyStaticI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n") || normalizeI18nText(el.textContent || "");
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title") || normalizeI18nText(el.getAttribute("title") || "");
      if (key) el.setAttribute("title", t(key));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key =
        el.getAttribute("data-i18n-placeholder") ||
        normalizeI18nText(el.getAttribute("placeholder") || "");
      if (key) el.setAttribute("placeholder", t(key));
    });
  }

  function normalizeLocaleCode(code) {
    if (!code) return "";
    const parts = code.split("-");
    if (parts.length === 1) return parts[0].toLowerCase();
    return `${parts[0].toLowerCase()}-${parts.slice(1).join("-")}`;
  }

  function findLanguage(code) {
    const norm = normalizeLocaleCode(code);
    return languages.find((row) => normalizeLocaleCode(row.code) === norm);
  }

  function resolveLocale() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("locale");
    if (fromUrl) return fromUrl;

    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored) return stored;
    } catch {
      /* ignore */
    }

    const browser = navigator.language || navigator.languages?.[0] || SOURCE_LOCALE;
    const match = findLanguage(browser);
    return match ? match.code : SOURCE_LOCALE;
  }

  function isSourceLocale(locale) {
    return normalizeLocaleCode(locale) === normalizeLocaleCode(SOURCE_LOCALE);
  }

  function loadJson(url) {
    return fetch(url, { cache: "no-store" }).then((res) => (res.ok ? res.json() : null));
  }

  function populateLocaleSelect(activeLocale) {
    const select = document.getElementById("locale-select");
    if (!select) return;

    select.replaceChildren();
    for (const row of languages) {
      const opt = document.createElement("option");
      opt.value = row.code;
      opt.textContent = row.label || row.code;
      if (normalizeLocaleCode(row.code) === normalizeLocaleCode(activeLocale)) {
        opt.selected = true;
      }
      select.appendChild(opt);
    }

    select.addEventListener("change", () => {
      const next = select.value;
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      const url = new URL(window.location.href);
      if (isSourceLocale(next)) {
        url.searchParams.delete("locale");
      } else {
        url.searchParams.set("locale", next);
      }
      window.location.href = url.toString();
    });
  }

  function wireTabs() {
    const tabs = document.getElementById("tabs");
    if (!tabs) return;

    tabs.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-tab]");
      if (!btn) return;

      const tabId = btn.getAttribute("data-tab");
      tabs.querySelectorAll("button[data-tab]").forEach((el) => {
        el.classList.toggle("active", el === btn);
      });
      document.querySelectorAll(".panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === `panel-${tabId}`);
      });
    });
  }

  function wireFilterDemo() {
    const clearBtn = document.getElementById("btn-clear");
    const applyBtn = document.getElementById("btn-apply");
    const filename = document.getElementById("filter-filename");

    if (clearBtn && filename) {
      clearBtn.addEventListener("click", () => {
        filename.value = "";
        document.getElementById("filter-locale").value = "";
        document.getElementById("filter-status").value = "";
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        /* static demo — no backend */
      });
    }
  }

  async function initI18n() {
    const manifest = await loadJson("/locales/ui-languages.json");
    languages = Array.isArray(manifest) ? manifest : [];

    I18N.locale = resolveLocale();
    const langRow = findLanguage(I18N.locale);
    I18N.dir = langRow?.direction === "rtl" ? "rtl" : "ltr";

    if (!isSourceLocale(I18N.locale)) {
      const bundle = await loadJson(`/locales/${encodeURIComponent(I18N.locale)}.json`);
      I18N.bundle = bundle && typeof bundle === "object" ? bundle : {};
    }

    document.documentElement.setAttribute("lang", langRow?.code || I18N.locale);
    document.documentElement.setAttribute("dir", I18N.dir);

    populateLocaleSelect(I18N.locale);
    applyStaticI18n();
    document.title = t(normalizeI18nText(document.title));
  }

  wireTabs();
  wireFilterDemo();
  initI18n().catch(() => {
    applyStaticI18n();
  });
})();
