/// <reference lib="dom" />
/**
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeI18nText } from "../../src/extractors/html-i18n-marks.js";

declare global {
  interface Window {
    i18n: {
      locale: string;
      ready: Promise<void>;
      apply: () => void;
      setLocale: (locale: string) => Promise<void>;
    };
  }
}

const runtimePath = path.join(process.cwd(), "src/html-runtime/i18n.js");
const RUNTIME = readFileSync(runtimePath, "utf8");

const LANGUAGES = [
  { code: "en", label: "English", englishName: "English", direction: "ltr", isSourceLocale: true },
  {
    code: "pt-BR",
    label: "Português (Brasil)",
    englishName: "Portuguese (Brazil)",
    direction: "ltr",
  },
  { code: "ar", label: "العربية", englishName: "Arabic", direction: "rtl" },
];

const BUNDLES: Record<string, Record<string, string>> = {
  "pt-BR": {
    Apply: "Aplicar",
    "Italian Trulli": "Trulli Italianos",
    "Plain HTML demo": "Demo HTML",
  },
  ar: { Apply: "تطبيق" },
};

function returnExpr(source: string): string {
  const match = source.match(/function normalizeI18nText\([\w: ]*\)\s*\{([\s\S]*?)\}/);
  return (match?.[1] ?? "").replace(/\s+/g, " ").trim();
}

interface BootOptions {
  html?: string;
  labelMode?: string;
  select?: boolean;
  list?: boolean;
  search?: string;
}

async function boot(opts: BootOptions = {}) {
  document.documentElement.className = "";
  document.documentElement.lang = "en";
  document.documentElement.removeAttribute("dir");
  document.head.innerHTML = "<title data-i18n>Plain HTML demo</title>";
  document.body.innerHTML =
    opts.html ??
    `<button data-i18n>Apply</button>
     <img id="pic" src="pic_trulli.jpg" alt="Italian Trulli" data-i18n-alt data-i18n-locale-src />
     <a id="about" href="about.html" data-i18n-locale-href>About</a>
     <select id="locale-select"></select>
     <div id="locale-list"></div>`;
  window.history.replaceState({}, "", "/app/index.html" + (opts.search ?? ""));
  localStorage.clear();
  const script = document.createElement("script");
  script.src = "http://localhost/app/i18n.js";
  script.setAttribute("data-ai-i18n-runtime", "");
  script.setAttribute("data-source-locale", "en");
  script.setAttribute("data-locales-base", "./locales");
  if (opts.labelMode) script.setAttribute("data-label-mode", opts.labelMode);
  if (opts.select !== false) script.setAttribute("data-locale-select", "#locale-select");
  if (opts.list) script.setAttribute("data-locale-list", "#locale-list");
  document.body.appendChild(script);

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const href = String(url);
      if (href.endsWith("/ui-languages.json")) {
        return { ok: true, json: async () => LANGUAGES };
      }
      for (const code of Object.keys(BUNDLES)) {
        if (href.endsWith(`/${code}.json`)) {
          return { ok: true, json: async () => BUNDLES[code] };
        }
      }
      return { ok: false, json: async () => null };
    })
  );

  window.eval(RUNTIME);
  await window.i18n.ready;
}

describe("normalizeI18nText parity", () => {
  it("matches the extractor, the dashboard runtime, and the plain-HTML runtime", () => {
    const dashboard = readFileSync(path.join(process.cwd(), "src/dashboard-app/app.js"), "utf8");
    const expr = returnExpr(RUNTIME);
    expect(expr).toBe(returnExpr(dashboard));
    expect(expr).toContain('return s.trim().replace(/\\s+/g, " ");');
    expect(normalizeI18nText("  a \n b  ")).toBe("a b");
  });
});

describe("plain HTML i18n runtime", () => {
  beforeEach(async () => {
    await boot();
  });

  it("starts on the source locale and translates after setLocale", async () => {
    expect(window.i18n.locale).toBe("en");
    expect(document.querySelector("button")?.textContent).toBe("Apply");
    expect(document.documentElement.classList.contains("i18n-pending")).toBe(false);

    await window.i18n.setLocale("pt-BR");
    expect(document.querySelector("button")?.textContent).toBe("Aplicar");
    expect(document.documentElement.lang).toBe("pt-BR");
    expect(document.documentElement.dir).toBe("ltr");
    expect(document.title).toBe("Demo HTML");
    expect(window.location.search).toBe("?locale=pt-BR");

    await window.i18n.setLocale("en");
    expect(document.querySelector("button")?.textContent).toBe("Apply");
    expect(window.location.search).toBe("");
  });

  it("rewrites image src and link href, then restores them for the source locale", async () => {
    const img = document.querySelector("#pic") as HTMLImageElement;
    const link = document.querySelector("#about") as HTMLAnchorElement;
    await window.i18n.setLocale("pt-BR");
    expect(img.getAttribute("src")).toBe("pic_trulli-pt-BR.jpg");
    expect(img.getAttribute("alt")).toBe("Trulli Italianos");
    expect(link.getAttribute("href")).toBe("/app/about.html?locale=pt-BR");

    await window.i18n.setLocale("en");
    expect(img.getAttribute("src")).toBe("pic_trulli.jpg");
    expect(img.getAttribute("alt")).toBe("Italian Trulli");
    expect(link.getAttribute("href")).toBe("about.html");
  });

  it("falls back to the original src when the localized image errors", async () => {
    const img = document.querySelector("#pic") as HTMLImageElement;
    await window.i18n.setLocale("pt-BR");
    img.dispatchEvent(new Event("error"));
    expect(img.getAttribute("src")).toBe("pic_trulli.jpg");
  });

  it("uses a valued src template and skips absolute URLs", async () => {
    document.body.innerHTML = `<img id="tpl" src="pic_trulli.jpg" data-i18n-locale-src="img/{locale}/pic_trulli.jpg" />
      <img id="abs" src="https://cdn.example/pic.jpg" data-i18n-locale-src />
      <a id="hash" href="#top" data-i18n-locale-href>Top</a>`;
    window.i18n.apply();
    await window.i18n.setLocale("pt-BR");
    expect(document.querySelector("#tpl")?.getAttribute("src")).toBe("img/pt-BR/pic_trulli.jpg");
    expect(document.querySelector("#abs")?.getAttribute("src")).toBe("https://cdn.example/pic.jpg");
    expect(document.querySelector("#hash")?.getAttribute("href")).toBe("#top");
  });

  it("keeps query and fragment on a suffixed image path", async () => {
    document.body.innerHTML = `<img id="q" src="pic_trulli.jpg?v=1#x" data-i18n-locale-src />`;
    window.i18n.apply();
    await window.i18n.setLocale("pt-BR");
    expect(document.querySelector("#q")?.getAttribute("src")).toBe("pic_trulli-pt-BR.jpg?v=1#x");
  });

  it("fills the locale select and switches from it", async () => {
    const select = document.querySelector("#locale-select") as HTMLSelectElement;
    expect(select.options).toHaveLength(3);
    expect(select.options[1]?.textContent).toBe("Português (Brasil)");
    select.value = "pt-BR";
    select.dispatchEvent(new Event("change"));
    await window.i18n.ready;
    await vi.waitFor(() => {
      expect(document.querySelector("button")?.textContent).toBe("Aplicar");
    });
  });

  it("renders a link list and marks the active locale", async () => {
    await boot({ list: true, labelMode: "both" });
    const list = document.querySelector("#locale-list") as HTMLElement;
    const links = [...list.querySelectorAll("a")];
    expect(links.map((a) => a.textContent)).toEqual([
      "English",
      "Portuguese (Brazil) / Português (Brasil)",
      "Arabic / العربية",
    ]);
    expect(links[0]?.getAttribute("aria-current")).toBe("true");
    expect(links[0]?.lang).toBe("en");
    links[2]?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(document.documentElement.dir).toBe("rtl");
    });
  });

  it("re-applies the source key after popstate", async () => {
    await window.i18n.setLocale("pt-BR");
    window.history.pushState({}, "", "/app/index.html");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await vi.waitFor(() => {
      expect(document.querySelector("button")?.textContent).toBe("Apply");
    });
  });

  it("resolves ?locale= before localStorage", async () => {
    localStorage.setItem("ai-i18n-locale", "ar");
    await boot({ search: "?locale=pt-BR", select: false });
    expect(window.i18n.locale).toBe("pt-BR");
    expect(document.querySelector("button")?.textContent).toBe("Aplicar");
  });

  it("matches the example copy and the documentation listing", () => {
    const example = readFileSync(
      path.join(process.cwd(), "examples/plain-html/public/i18n.js"),
      "utf8"
    );
    const guide = readFileSync(
      path.join(process.cwd(), "docs/guide/ui-strings/plain-html.md"),
      "utf8"
    );
    const fence = guide.match(/```javascript\n(\/\* global document[\s\S]*?)\n```/);
    expect(example.replace(/\n$/, "")).toBe(RUNTIME.replace(/\n$/, ""));
    expect(fence?.[1]).toBe(RUNTIME.replace(/\n$/, ""));
  });

  it("falls back to English when the bundle is missing", async () => {
    await window.i18n.setLocale("de");
    expect(document.querySelector("button")?.textContent).toBe("Apply");
    expect(document.documentElement.lang).toBe("de");
  });
});
