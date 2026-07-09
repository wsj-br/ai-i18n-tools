import { Footer, LastUpdated, Layout, LocaleSwitch, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import type { FC, ReactNode } from "react";
import { getDictionary } from "../_dictionaries/get-dictionary";
import { resolveSiteLocale } from "../../lib/site-locales";
import "nextra-theme-docs/style.css";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  "pt-BR": "Português (Brasil)",
  "zh-Hans": "简体中文",
};

type LayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{ lang: string }>;
}>;

const RootLayout: FC<LayoutProps> = async ({ children, params }) => {
  const { lang: rawLang } = await params;
  const lang = resolveSiteLocale(rawLang);
  const dictionary = await getDictionary(lang);
  const pageMap = await getPageMap(`/${lang}`);

  const navbar = (
    <Navbar logo={<b>{dictionary.siteTitle}</b>}>
      <LocaleSwitch lite />
    </Navbar>
  );

  const footer = <Footer>{dictionary.footer}</Footer>;

  return (
    <html lang={lang} dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs"
          editLink={dictionary.editLink}
          toc={{ title: dictionary.tocTitle }}
          lastUpdated={
            <LastUpdated locale={lang}>{dictionary.lastUpdated}</LastUpdated>
          }
          i18n={[
            { locale: "en", name: LOCALE_LABELS.en },
            { locale: "pt-BR", name: LOCALE_LABELS["pt-BR"] },
            { locale: "zh-Hans", name: LOCALE_LABELS["zh-Hans"] },
          ]}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
};

export default RootLayout;
