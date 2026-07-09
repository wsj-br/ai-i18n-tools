import type { ReactNode } from "react";
import { I18nProvider } from "fumadocs-ui/contexts/i18n";
import { i18nProvider } from "fumadocs-ui/i18n";
import { translations } from "@/lib/layout.shared";
import { SetHtmlLang } from "./set-html-lang";

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <I18nProvider {...i18nProvider(translations, lang)}>
      <SetHtmlLang lang={lang} />
      {children}
    </I18nProvider>
  );
}
