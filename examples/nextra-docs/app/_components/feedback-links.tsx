import { getT } from "../../lib/ui-t";

type FeedbackLinksProps = {
  lang: string;
  page: string;
};

/** Custom chrome translated with `t()` + `translate-ui`, beside the theme dictionary. */
export async function FeedbackLinks({ lang, page }: FeedbackLinksProps) {
  const t = await getT(lang);
  return (
    <p>
      {t("Was this page helpful?")}{" "}
      <a href="https://github.com/wsj-br/ai-i18n-tools/issues">{t("Send feedback")}</a>
      {". "}
      {t("You are reading {{page}}.", { page })}
    </p>
  );
}
