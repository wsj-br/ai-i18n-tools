"use client";

import uiLanguages from "../../locales/ui-languages.json";
import i18n, { loadLocale, SOURCE_LOCALE } from "@/lib/i18n";
import { isCurrentRequest, pickLocale } from "@/lib/locale-gate";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

type UiLang = { code: string; label: string; englishName: string };

const locales = uiLanguages as UiLang[];

const VALID_LOCALES = new Set(locales.map((entry) => entry.code));

/** Sample counts for the cardinal plural demo (`Sections` block). */
const PLURAL_DEMO_COUNTS = [1, 2, 5, 50] as const;

function optionLabel({ englishName, label }: UiLang): string {
  if (englishName !== label)
    return `${label} / ${englishName}`
  else
    return `${englishName}`;  
}

function HomePageContent() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = pickLocale(searchParams.get("locale"), VALID_LOCALES, SOURCE_LOCALE);
  const [locale, setLocale] = useState(requested);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const requestTicket = useRef(0);

  const applyLocale = useCallback(async (next: string) => {
    const mine = ++requestTicket.current;
    setPhase("loading");
    setLoadError("");
    try {
      await loadLocale(next);
      if (!isCurrentRequest(mine, requestTicket.current)) return;
      await i18n.changeLanguage(next);
      if (!isCurrentRequest(mine, requestTicket.current)) return;
      setLocale(next);
      setPhase("ready");
    } catch (error) {
      if (!isCurrentRequest(mine, requestTicket.current)) return;
      setLoadError(error instanceof Error ? error.message : String(error));
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    void applyLocale(requested);
  }, [applyLocale, requested]);

  const onLocaleChange = useCallback(
    async (next: string) => {
      await applyLocale(next);
      const nextSearch = new URLSearchParams(searchParams.toString());
      nextSearch.set("locale", next);
      const query = nextSearch.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [applyLocale, pathname, router, searchParams],
  );

  return (
    <main>
      <div className="locale-row">
        <label htmlFor="locale">Locale</label>
        <select
          id="locale"
          value={requested}
          onChange={(e) => void onLocaleChange(e.target.value)}
        >
          {locales.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {optionLabel(entry)}
            </option>
          ))}
        </select>
      </div>
      <hr />
      {phase === "loading" ? <p>Loading…</p> : null}
      {phase === "error" ? <p role="alert">{loadError}</p> : null}
      {phase === "ready" ? (
      <>
      <h1>{t("ai-i18n-tools: Next.js example app")}</h1>
      <div className="lines">
        <p>{t("Hello World!")}</p>
        <p>{t("This line will be translated to multiple languages.")}</p>
        <p>{t("This is line number {{number}}", { number: 3 })}</p>
        <br />
        <p>
          <strong>{t("Plurals: automatic generation usage example")}</strong>
        </p>
        <pre className="code-block">
          <code>
{`<i>count = {{count}}</i>: &nbsp; 
{t("This page has {{count}} sections", { plurals: true, count })}`}
          </code>
        </pre>
        {PLURAL_DEMO_COUNTS.map((count) => (
          <p key={count} style={{ marginLeft: "18px" }}>
            <i>count = {count}</i>: &nbsp;
            {t("This page has {{count}} sections", {
              plurals: true,
              count,
            })}
          </p>
        ))}
      </div>
      <hr />
      <div className="demo-svg">
        <div className="demo-svg-frame">
          <img
            src={`/assets/translation_demo_svg.${locale}.svg`}
            height={350}
            alt={t("Translation demo illustration")}
          />
          <p className="demo-svg-caption">
            {t("ai-i18n-tools translated the texts contained within this SVG illustration.")}
          </p>
        </div>
      </div>
      </>
      ) : null}
    </main>
  );
}

function LocaleFallback() {
  return (
    <main>
      <p>Loading…</p>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LocaleFallback />}>
      <HomePageContent />
    </Suspense>
  );
}
