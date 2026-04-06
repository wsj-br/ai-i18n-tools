import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n, { loadLocale, normalizeLocale, supportedLocaleCodes } from "./i18n.js";

function readInitialLocale() {
  const raw = new URLSearchParams(window.location.search).get("locale");
  if (!raw) {
    return "pt-BR";
  }
  const want = normalizeLocale(raw);
  const match = supportedLocaleCodes.find((code) => normalizeLocale(code) === want);
  return match ?? "pt-BR";
}

export default function App() {
  const { t } = useTranslation();
  const [lang, setLang] = useState(readInitialLocale);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadLocale(lang);
      if (!cancelled) {
        await i18n.changeLanguage(lang);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "1.25rem", maxWidth: "40rem" }}>
      <label htmlFor="locale-select" style={{ display: "block", marginBottom: "1rem" }}>
        Idioma / Language{" "}
        <select
          id="locale-select"
          value={lang}
          onChange={(e) => {
            const next = e.target.value;
            setLang(next);
            const url = new URL(window.location.href);
            url.searchParams.set("locale", next);
            window.history.replaceState({}, "", url);
          }}
        >
          {supportedLocaleCodes.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </label>
      <p>{t("Bem-vindo ao exemplo no terminal.")}</p>
      <p>{t("Até logo.")}</p>
      <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "2rem" }}>
        Same pattern as Transrewrt: <code>useTranslation()</code> and literal keys in <code>t()</code> for
        extraction. Optional URL: <code>?locale=en-GB</code>
      </p>
    </main>
  );
}
