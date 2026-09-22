import { useIntlayer } from "react-intlayer";

export function MultiPlaceholderBanner({ name, count }: { name: string; count: number }) {
  const content = useIntlayer("multi-placeholder");
  const text = content.greeting.value
    .replace("{name}", name)
    .replace("{count}", String(count));
  return (
    <section className="card">
      <h2>Chained replace</h2>
      <p className="muted">.replace().replace() — flagged as manual review</p>
      <p>{text}</p>
    </section>
  );
}
