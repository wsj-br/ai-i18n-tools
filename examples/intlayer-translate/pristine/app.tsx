import { useState } from "react";
import { IntlayerProvider } from "react-intlayer";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { LOCALE_LABELS, SOURCE_LOCALE, TARGET_LOCALES } from "./i18n";

const LOCALES = [SOURCE_LOCALE, ...TARGET_LOCALES];

export function App() {
  const [locale, setLocale] = useState<string>(SOURCE_LOCALE);

  return (
    <IntlayerProvider locale={locale}>
      <main className="page">
        <label className="locale-picker">
          Locale{" "}
          <select value={locale} onChange={(e) => setLocale(e.target.value)}>
            {LOCALES.map((code) => (
              <option key={code} value={code}>
                {LOCALE_LABELS[code] ?? code} ({code})
              </option>
            ))}
          </select>
        </label>
        <Header name="Ada" alertCount={3} />
        <Dashboard />
      </main>
    </IntlayerProvider>
  );
}
