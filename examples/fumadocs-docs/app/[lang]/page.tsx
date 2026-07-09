import { redirect } from "next/navigation";
import { i18n } from "@/lib/i18n";

export default async function LangIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (i18n.hideLocale === "default-locale" && lang === i18n.defaultLanguage) {
    redirect("/docs");
  }

  redirect(`/${lang}/docs`);
}
