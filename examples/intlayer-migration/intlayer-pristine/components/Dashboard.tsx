import { useIntlayer } from "react-intlayer";

export function Dashboard() {
  const content = useIntlayer("dashboard");
  const common = useIntlayer("common");
  return (
    <section className="card">
      <h2>{content.heading.value}</h2>
      <dl>
        <div>
          <dt>{content.servers.value}</dt>
          <dd>12</dd>
        </div>
        <div>
          <dt>{content.lastRefresh.value}</dt>
          <dd>09:41</dd>
        </div>
        <div>
          <dt>{common.navigation.dashboard.value}</dt>
          <dd>ok</dd>
        </div>
      </dl>
    </section>
  );
}
