import { useIntlayer } from "react-intlayer";

export function Dashboard() {
  const content = useIntlayer("dashboard");
  return (
    <section className="card">
      <h2>{content.heading.value}</h2>
      <dl>
        <div>
          <dt>{content.stats.servers.value}</dt>
          <dd>12</dd>
        </div>
        <div>
          <dt>{content.stats.online.value}</dt>
          <dd>11</dd>
        </div>
        <div>
          <dt>{content.stats.lastRefresh.value}</dt>
          <dd>09:41</dd>
        </div>
      </dl>
      <div className="row">
        <button type="button">{content.actions.refresh.value}</button>
        <button type="button" className="ghost">
          {content.actions.settings.value}
        </button>
      </div>
    </section>
  );
}
