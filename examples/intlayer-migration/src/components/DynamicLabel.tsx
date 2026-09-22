import { useIntlayer } from "react-intlayer";

type StatusKey = "ok" | "warn" | "fail";

export function DynamicLabel({ statusKey }: { statusKey: StatusKey }) {
  const content = useIntlayer("dynamic-key");
  return (
    <section className="card">
      <h2>Dynamic key</h2>
      <p className="muted">content[statusKey].value — flagged as manual review</p>
      <p className={`pill ${statusKey}`}>{content[statusKey].value}</p>
    </section>
  );
}
