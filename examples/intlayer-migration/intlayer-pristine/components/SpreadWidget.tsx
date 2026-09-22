import { useIntlayer } from "react-intlayer";

function StatusBadge(props: { ok: { value: string }; fail: { value: string } }) {
  return (
    <p>
      <span className="pill ok">{props.ok.value}</span>{" "}
      <span className="pill fail">{props.fail.value}</span>
    </p>
  );
}

export function SpreadWidget() {
  const content = useIntlayer("spread-props");
  return (
    <section className="card">
      <h2>Spread props</h2>
      <p className="muted">{"<StatusBadge {...content} />"} — flagged as manual review</p>
      <StatusBadge {...content} />
    </section>
  );
}
