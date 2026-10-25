import { useIntlayer } from "react-intlayer";

export function Header({ name, alertCount }: { name: string; alertCount: number }) {
  const app = useIntlayer("app");
  return (
    <header className="card">
      <p className="eyebrow">{app.subtitle.value}</p>
      <h1>{app.title.value}</h1>
      <p>{app.greeting({ name })}</p>
      <p className="muted">{app.alerts({ count: alertCount })}</p>
    </header>
  );
}
