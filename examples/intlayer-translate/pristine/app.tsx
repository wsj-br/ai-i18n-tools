import { getLocaleName } from "intlayer";
import { IntlayerProvider, useLocale } from "react-intlayer";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";

function LocalePicker() {
  const { locale, availableLocales, setLocale } = useLocale();
  return (
    <label className="locale-picker">
      Locale{" "}
      <select
        value={locale}
        onChange={(e) => {
          const next = availableLocales.find((code) => code === e.target.value);
          if (next) {
            setLocale(next);
          }
        }}
      >
        {availableLocales.map((code) => (
          <option key={code} value={code}>
            {getLocaleName(code, code)} ({code})
          </option>
        ))}
      </select>
    </label>
  );
}

export function App() {
  return (
    <IntlayerProvider>
      <main className="page">
        <LocalePicker />
        <Header name="Ada" alertCount={3} />
        <Dashboard />
      </main>
    </IntlayerProvider>
  );
}
