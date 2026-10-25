import { useIntlayer } from "react-intlayer";
import { fill } from "../i18n";

export function Header({ name, alertCount }: { name: string; alertCount: number }) {
  const app = useIntlayer("app");
  return (
    <header className="card">
      <p className="eyebrow">{app.subtitle.value}</p>
      <h1>{app.title.value}</h1>
      <p>{fill(app.greeting.value, { name })}</p>
      <p className="muted">{fill(app.alerts.value, { count: alertCount })}</p>
    </header>
  );
}
