import { useIntlayer } from "react-intlayer";

export function Header({ pageName }: { pageName: string }) {
  const content = useIntlayer("app-header");
  const common = useIntlayer("common");
  const help = common.navigation.helpFor.value.replace("{pageName}", pageName);
  return (
    <header className="card">
      <p className="eyebrow">{content.subtitle.value}</p>
      <h1>{content.title.value}</h1>
      <p className="muted">{help}</p>
      <div className="row">
        <button type="button">{common.ui.save.value}</button>
        <button type="button" className="ghost">
          {common.ui.cancel.value}
        </button>
        <button type="button" className="ghost">
          {common.ui.back.value}
        </button>
      </div>
    </header>
  );
}
