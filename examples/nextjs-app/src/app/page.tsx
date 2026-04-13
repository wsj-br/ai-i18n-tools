"use client";

import uiLanguages from "../../locales/ui-languages.json";
import i18n, { loadLocale, SOURCE_LOCALE } from "@/lib/i18n";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

type UiLang = { code: string; label: string; englishName: string };

const locales = uiLanguages as UiLang[];

function optionLabel({ englishName, label }: UiLang): string {
  if (englishName !== label)
    return `${label} / ${englishName}`
  else
    return `${englishName}`;  
}

export default function HomePage() {
  const { t } = useTranslation();
  const [locale, setLocale] = useState(SOURCE_LOCALE);

  const onLocaleChange = useCallback(
    async (next: string) => {
      setLocale(next);
      await loadLocale(next);
      await i18n.changeLanguage(next);
    },
    [],
  );

  return (
    <main>
      <h1>{t("AI-i18n-tools: Next.js example app")}</h1>
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
        <p>{t("Hello World!!")}</p>
        <p>{t("This line will be translated to multiple languages.")}</p>
        <p>{t("This is line number {{number}}", { number: 3 })}</p>
      </div>
      <hr />
      <div className="demo-svg">
        <div className="demo-svg-frame">
          <img
            src={`/assets/translation_demo_svg.${locale}.svg`}
            height={400}
            alt={t("Translation demo illustration")}
          />
          <p className="demo-svg-caption">
            {t("ai-i18n-tools is translating the texts contained within this SVG ilustration.")}
          </p>
        </div>
      </div>
    </main>
  );
}
