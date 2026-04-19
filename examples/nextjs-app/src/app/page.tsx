"use client";

import uiLanguages from "../../locales/ui-languages.json";
import i18n, { loadLocale, SOURCE_LOCALE } from "@/lib/i18n";
import { Suspense, useCallback, useLayoutEffect, useState } from "react";
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
  const [locale, setLocale] = useState(() => {
    const param = searchParams.get("locale");
    return param && VALID_LOCALES.has(param) ? param : SOURCE_LOCALE;
  });

  const applyLocale = useCallback(async (next: string) => {
    setLocale(next);
    await loadLocale(next);
    await i18n.changeLanguage(next);
  }, []);

  useLayoutEffect(() => {
    const param = searchParams.get("locale");
    const target =
      param && VALID_LOCALES.has(param) ? param : SOURCE_LOCALE;
    if (target === i18n.language) return;
    void applyLocale(target);
  }, [applyLocale, searchParams]);

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
      <h1>{t("ai-i18n-tools: Next.js example app")}</h1>
      <div className="locale-row">
        <label htmlFor="locale">Locale</label>
        <select
          id="locale"
          value={locale}
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
      <div className="lines">
        <p>{t("Hello World!")}</p>
        <p>{t("This line will be translated to multiple languages.")}</p>
        <p>{t("This is line number {{number}}", { number: 3 })}</p>
        <br />
        <p>
          <strong>{t("Plurals: automatic generation usage example")}</strong>
     
     
          <br />
          <pre className="code-block">
            <code>
{`<i>count = {{count}}</i>: &nbsp; 
{t("This page has {{count}} sections", { plurals: true, count })}`}
            </code>
          </pre>
        </p>
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
