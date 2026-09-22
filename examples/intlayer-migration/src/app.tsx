import { useState } from "react";
import { IntlayerProvider } from "react-intlayer";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { DynamicLabel } from "./components/DynamicLabel";
import { SpreadWidget } from "./components/SpreadWidget";
import { MultiPlaceholderBanner } from "./components/MultiPlaceholderBanner";
import { SOURCE_LOCALE, TARGET_LOCALES, loadLocale } from "./i18n";

const LOCALES = [SOURCE_LOCALE, ...TARGET_LOCALES];

export function App() {
  const [locale, setLocale] = useState(SOURCE_LOCALE);

  async function onChange(next: string) {
    await loadLocale(next);
    setLocale(next);
  }

  return (
    <IntlayerProvider locale={locale}>
      <main className="page">
        <label className="locale-picker">
          Locale{" "}
          <select value={locale} onChange={(e) => void onChange(e.target.value)}>
            {LOCALES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <Header pageName="Servers" />
        <Dashboard />
        <DynamicLabel statusKey="warn" />
        <SpreadWidget />
        <MultiPlaceholderBanner name="Ada" count={3} />
      </main>
    </IntlayerProvider>
  );
}
