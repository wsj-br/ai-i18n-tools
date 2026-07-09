import { addBasePath } from "next/dist/client/add-base-path";
import { NextResponse, type NextRequest } from "next/server";
import {
  defaultSiteLocale,
  isSiteLocale,
  resolveSiteLocale,
  siteLocales,
  stripInvalidLocalePrefix,
} from "./lib/site-locales";

const HAS_LOCALE_RE = new RegExp(String.raw`^\/(${siteLocales.join("|")})(\/|$)`);
const COOKIE_NAME = "NEXT_LOCALE";

function redirectToLocale(request: NextRequest, locale: string, pathname = "") {
  const response = NextResponse.redirect(
    new URL(addBasePath(`/${locale}${pathname}`), request.url),
  );
  response.cookies.set(COOKIE_NAME, locale);
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;

  if (HAS_LOCALE_RE.test(pathname)) {
    const [, requestLocale] = pathname.split("/", 2);
    const rest = pathname.slice((requestLocale?.length ?? 0) + 1);

    if (!isSiteLocale(requestLocale)) {
      return redirectToLocale(request, defaultSiteLocale, rest);
    }

    const response = NextResponse.next();
    if (requestLocale !== cookieLocale) {
      response.cookies.set(COOKIE_NAME, requestLocale);
    }
    return response;
  }

  const { rest } = stripInvalidLocalePrefix(pathname);
  const targetLocale = resolveSiteLocale(cookieLocale);
  return redirectToLocale(request, targetLocale, rest);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest|_pagefind).*)",
  ],
};
