import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import { USER_EDITED_MODEL } from "../../src/core/user-edited-model.js";
import { runTranslateUI } from "../../src/cli/translate-ui-strings.js";

function mockJsonResponse(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function buildConfig() {
  return parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en",
      targetLocales: ["de"],
      glossary: {
        uiGlossary: "strings.json",
        userGlossary: "glossary-user.csv",
      },
      ui: {
        sourceRoots: ["src/"],
        stringsJson: "strings.json",
        flatOutputDir: "locales",
      },
      cacheDir: ".translation-cache",
      docs: [{ contentPaths: [], outputDir: "./i18n" }],
      provider: "openrouter",
      providers: {
        openrouter: {
          translationModels: ["model-a"],
          maxTokens: 100,
          temperature: 0,
        },
      },
      features: {
        translateUIStrings: true,
        translateDocs: false,
      },
    })
  );
}

describe("runTranslateUI", () => {
  let tmp: string;
  let prevKey: string | undefined;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ai-i18n-ui-translate-"));
    prevKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test-key";
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (prevKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = prevKey;
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("uses only userGlossary hints for UI translation", async () => {
    fs.writeFileSync(
      path.join(tmp, "strings.json"),
      JSON.stringify(
        {
          save: { source: "Save" },
          cancel: {
            source: "Cancel",
            translated: { de: "Abbrechen" },
          },
          cancelAccount: { source: "Cancel account" },
        },
        null,
        2
      ),
      "utf8"
    );
    fs.writeFileSync(
      path.join(tmp, "glossary-user.csv"),
      ["Original language string,locale,Translation", "Save,de,Speichern"].join("\n"),
      "utf8"
    );

    const completionBody = {
      id: "r1",
      choices: [
        { message: { content: '["Speichern","Konto schliessen"]' }, finish_reason: "stop" },
      ],
      usage: {
        prompt_tokens: 1,
        completion_tokens: 2,
        total_tokens: 3,
      },
    };
    const fetchMock = vi.fn().mockImplementation((reqUrl: string | URL | Request) => {
      const u =
        typeof reqUrl === "string" ? reqUrl : reqUrl instanceof URL ? reqUrl.href : reqUrl.url;
      if (u.includes("/models")) {
        return Promise.resolve(
          mockJsonResponse({
            data: [{ id: "model-a", pricing: { prompt: "0", completion: "0" } }],
          })
        );
      }
      return Promise.resolve(mockJsonResponse(completionBody));
    });
    vi.stubGlobal("fetch", fetchMock);

    await runTranslateUI(buildConfig(), {
      cwd: tmp,
      locales: ["de"],
      force: false,
      dryRun: false,
      verbose: false,
    });

    const chatCalls = fetchMock.mock.calls.filter((c) => !String(c[0]).includes("/models"));
    expect(chatCalls.length).toBe(1);
    const init = chatCalls[0]?.[1] as { body?: string } | undefined;
    const payload = JSON.parse(String(init?.body)) as {
      messages: Array<{ content: string | Array<{ text?: string }> }>;
    };
    const systemMessage = payload.messages[0]?.content;
    const systemPrompt = Array.isArray(systemMessage)
      ? String(systemMessage[0]?.text ?? "")
      : String(systemMessage ?? "");

    expect(systemPrompt).toContain('- "Save" → "Speichern"');
    expect(systemPrompt).not.toContain('- "Cancel" → "Abbrechen"');

    const written = JSON.parse(fs.readFileSync(path.join(tmp, "strings.json"), "utf8")) as Record<
      string,
      { translated?: Record<string, string>; models?: Record<string, string> }
    >;
    expect(written.save?.models?.de).toBe("model-a");
    expect(written.cancelAccount?.models?.de).toBe("model-a");
  });

  it("appends user-edited strings to userGlossary CSV and logs [user-glossary]", async () => {
    fs.writeFileSync(
      path.join(tmp, "strings.json"),
      JSON.stringify(
        {
          h1: {
            source: "Hello",
            translated: { de: "Hallo" },
            models: { de: USER_EDITED_MODEL },
          },
        },
        null,
        2
      ),
      "utf8"
    );
    fs.writeFileSync(
      path.join(tmp, "glossary-user.csv"),
      ["Original language string,locale,Translation", "Other,de,Anders"].join("\n") + "\n",
      "utf8"
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((reqUrl: string | URL | Request) => {
        const u =
          typeof reqUrl === "string" ? reqUrl : reqUrl instanceof URL ? reqUrl.href : reqUrl.url;
        if (u.includes("/models")) {
          return Promise.resolve(
            mockJsonResponse({
              data: [{ id: "model-a", pricing: { prompt: "0", completion: "0" } }],
            })
          );
        }
        return Promise.resolve(
          mockJsonResponse({
            id: "r1",
            choices: [{ message: { content: "[]" }, finish_reason: "stop" }],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          })
        );
      })
    );

    await runTranslateUI(buildConfig(), {
      cwd: tmp,
      locales: ["de"],
      force: false,
      dryRun: false,
      verbose: false,
    });

    const csv = fs.readFileSync(path.join(tmp, "glossary-user.csv"), "utf8");
    expect(csv).toContain("Hello,de,Hallo");

    const logMock = vi.mocked(console.log);
    expect(
      logMock.mock.calls.some((args) =>
        String(args[0]).includes("[user-glossary] Added 1 user-edited entry")
      )
    ).toBe(true);
  });

  it("retranslates cached Hindi that is romanized Latin without --force", async () => {
    fs.writeFileSync(
      path.join(tmp, "strings.json"),
      JSON.stringify(
        {
          hello: {
            source: "Hello",
            translated: { hi: "Namaste" },
          },
          brand: {
            source: "GitHub",
            translated: { hi: "GitHub" },
          },
        },
        null,
        2
      ),
      "utf8"
    );
    fs.writeFileSync(
      path.join(tmp, "glossary-user.csv"),
      ["Original language string,locale,Translation"].join("\n"),
      "utf8"
    );

    const fetchMock = vi.fn().mockImplementation((reqUrl: string | URL | Request) => {
      const u =
        typeof reqUrl === "string" ? reqUrl : reqUrl instanceof URL ? reqUrl.href : reqUrl.url;
      if (u.includes("/models")) {
        return Promise.resolve(
          mockJsonResponse({
            data: [{ id: "model-a", pricing: { prompt: "0", completion: "0" } }],
          })
        );
      }
      return Promise.resolve(
        mockJsonResponse({
          id: "r1",
          choices: [{ message: { content: '["नमस्ते"]' }, finish_reason: "stop" }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const config = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["hi"],
        glossary: {
          uiGlossary: "strings.json",
          userGlossary: "glossary-user.csv",
        },
        ui: {
          sourceRoots: ["src/"],
          stringsJson: "strings.json",
          flatOutputDir: "locales",
        },
        cacheDir: ".translation-cache",
        docs: [{ contentPaths: [], outputDir: "./i18n" }],
        provider: "openrouter",
        providers: {
          openrouter: {
            translationModels: ["model-a"],
            maxTokens: 100,
            temperature: 0,
          },
        },
        features: {
          translateUIStrings: true,
          translateDocs: false,
        },
      })
    );

    await runTranslateUI(config, {
      cwd: tmp,
      locales: ["hi"],
      force: false,
      dryRun: false,
      verbose: false,
    });

    const chatCalls = fetchMock.mock.calls.filter((c) => !String(c[0]).includes("/models"));
    expect(chatCalls.length).toBe(1);
    const init = chatCalls[0]?.[1] as { body?: string } | undefined;
    const payload = JSON.parse(String(init?.body)) as {
      messages: Array<{ content: string | Array<{ text?: string }> }>;
    };
    const userMessage = payload.messages[payload.messages.length - 1]?.content;
    const userPrompt = Array.isArray(userMessage)
      ? String(userMessage[0]?.text ?? "")
      : String(userMessage ?? "");
    expect(userPrompt).toContain("Hello");
    expect(userPrompt).not.toContain("GitHub");

    const written = JSON.parse(fs.readFileSync(path.join(tmp, "strings.json"), "utf8")) as Record<
      string,
      { translated?: Record<string, string> }
    >;
    expect(written.hello?.translated?.hi).toBe("नमस्ते");
    expect(written.brand?.translated?.hi).toBe("GitHub");
  });

  describe("plural Step 0 under --force", () => {
    const PLURAL_FORMS = {
      zero: "{{count}} nuevo",
      one: "{{count}} nuevo",
      two: "{{count}} nuevos",
      few: "{{count}} nuevos",
      many: "{{count}} nuevos",
      other: "{{count}} nuevos",
    };

    function writePluralCatalog(): void {
      fs.writeFileSync(
        path.join(tmp, "strings.json"),
        JSON.stringify(
          {
            itemcount: {
              plural: true,
              source: "{{count}} item",
              translated: {
                en: { one: "{{count}} item", other: "{{count}} items" },
                es: { one: "{{count}} artículo", other: "{{count}} artículos" },
              },
              models: { en: "model-a", es: "model-a" },
            },
          },
          null,
          2
        ),
        "utf8"
      );
    }

    function stubPluralFetch(): ReturnType<typeof vi.fn> {
      const fetchMock = vi.fn().mockImplementation((reqUrl: string | URL | Request) => {
        const u =
          typeof reqUrl === "string" ? reqUrl : reqUrl instanceof URL ? reqUrl.href : reqUrl.url;
        if (u.includes("/models")) {
          return Promise.resolve(
            mockJsonResponse({
              data: [{ id: "model-a", pricing: { prompt: "0", completion: "0" } }],
            })
          );
        }
        return Promise.resolve(
          mockJsonResponse({
            id: "r1",
            choices: [
              { message: { content: JSON.stringify(PLURAL_FORMS) }, finish_reason: "stop" },
            ],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          })
        );
      });
      vi.stubGlobal("fetch", fetchMock);
      return fetchMock;
    }

    function buildPluralConfig() {
      return parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          targetLocales: ["es"],
          ui: {
            sourceRoots: ["src/"],
            stringsJson: "strings.json",
            flatOutputDir: "locales",
          },
          cacheDir: ".translation-cache",
          docs: [{ contentPaths: [], outputDir: "./i18n" }],
          provider: "openrouter",
          providers: {
            openrouter: {
              translationModels: ["model-a"],
              maxTokens: 100,
              temperature: 0,
            },
          },
          features: {
            translateUIStrings: true,
            translateDocs: false,
          },
        })
      );
    }

    function readSourceForms(): Record<string, string> | undefined {
      const written = JSON.parse(fs.readFileSync(path.join(tmp, "strings.json"), "utf8")) as Record<
        string,
        { translated?: Record<string, Record<string, string>> }
      >;
      return written.itemcount?.translated?.en;
    }

    it("--force on a target locale leaves populated source-locale forms untouched", async () => {
      writePluralCatalog();
      const fetchMock = stubPluralFetch();

      await runTranslateUI(buildPluralConfig(), {
        cwd: tmp,
        locales: ["es"],
        force: true,
        dryRun: false,
        verbose: false,
      });

      // One Pass B call for `es` only — no Step 0 call for the source locale.
      const chatCalls = fetchMock.mock.calls.filter((c) => !String(c[0]).includes("/models"));
      expect(chatCalls.length).toBe(1);
      expect(readSourceForms()).toEqual({ one: "{{count}} item", other: "{{count}} items" });
    });

    it("forceSourcePlurals re-runs Step 0 for the source locale", async () => {
      writePluralCatalog();
      const fetchMock = stubPluralFetch();

      await runTranslateUI(buildPluralConfig(), {
        cwd: tmp,
        locales: ["es"],
        force: true,
        forceSourcePlurals: true,
        dryRun: false,
        verbose: false,
      });

      const chatCalls = fetchMock.mock.calls.filter((c) => !String(c[0]).includes("/models"));
      expect(chatCalls.length).toBe(2);
      expect(readSourceForms()?.other).toBe("{{count}} nuevos");
    });

    it("still fills source-locale forms that are missing without any force flag", async () => {
      fs.writeFileSync(
        path.join(tmp, "strings.json"),
        JSON.stringify(
          {
            itemcount: {
              plural: true,
              source: "{{count}} item",
              translated: {},
            },
          },
          null,
          2
        ),
        "utf8"
      );
      stubPluralFetch();

      await runTranslateUI(buildPluralConfig(), {
        cwd: tmp,
        locales: ["es"],
        force: false,
        dryRun: false,
        verbose: false,
      });

      expect(readSourceForms()?.other).toBe("{{count}} nuevos");
    });
  });

  function requestUrl(reqUrl: string | URL | Request): string {
    return typeof reqUrl === "string" ? reqUrl : reqUrl instanceof URL ? reqUrl.href : reqUrl.url;
  }

  function chatUserSources(init: RequestInit | undefined): string[] {
    const payload = JSON.parse(String(init?.body)) as {
      messages?: Array<{ content: string | Array<{ text?: string }> }>;
    };
    const userMessage = payload.messages?.[payload.messages.length - 1]?.content;
    const userPrompt = Array.isArray(userMessage)
      ? String(userMessage[0]?.text ?? "")
      : String(userMessage ?? "");
    return JSON.parse(userPrompt) as string[];
  }

  function writePlainCatalog(count: number): void {
    const catalog: Record<string, { source: string }> = {};
    for (let i = 0; i < count; i++) {
      catalog[`k${i}`] = { source: `String ${i}` };
    }
    fs.writeFileSync(path.join(tmp, "strings.json"), JSON.stringify(catalog, null, 2), "utf8");
    fs.writeFileSync(
      path.join(tmp, "glossary-user.csv"),
      "Original language string,locale,Translation\n",
      "utf8"
    );
  }

  function readPlainTranslations(): Record<string, { translated?: Record<string, string> }> {
    return JSON.parse(fs.readFileSync(path.join(tmp, "strings.json"), "utf8")) as Record<
      string,
      { translated?: Record<string, string> }
    >;
  }

  it("runs two plain chunks concurrently by default (uiBatchConcurrency 2)", async () => {
    writePlainCatalog(51);

    let inFlight = 0;
    let maxInFlight = 0;
    const releasers: Array<() => void> = [];
    const releaseAll = (): void => {
      for (const release of releasers) {
        release();
      }
    };
    const holdTimeout = setTimeout(releaseAll, 5000);
    const fetchMock = vi
      .fn()
      .mockImplementation((reqUrl: string | URL | Request, init?: RequestInit) => {
        const u = requestUrl(reqUrl);
        if (u.includes("/models")) {
          return Promise.resolve(
            mockJsonResponse({
              data: [{ id: "model-a", pricing: { prompt: "0", completion: "0" } }],
            })
          );
        }
        return (async () => {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await new Promise<void>((resolve) => {
            releasers.push(resolve);
            if (releasers.length >= 2) {
              releaseAll();
            }
          });
          inFlight -= 1;
          const sources = chatUserSources(init);
          const translations = sources.map((s) => `DE:${s}`);
          return mockJsonResponse({
            id: "r1",
            choices: [
              { message: { content: JSON.stringify(translations) }, finish_reason: "stop" },
            ],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          });
        })();
      });
    vi.stubGlobal("fetch", fetchMock);

    try {
      await runTranslateUI(buildConfig(), {
        cwd: tmp,
        locales: ["de"],
        force: false,
        dryRun: false,
        verbose: false,
      });
    } finally {
      clearTimeout(holdTimeout);
      releaseAll();
    }

    expect(maxInFlight).toBeGreaterThanOrEqual(2);
    const written = readPlainTranslations();
    expect(written.k0?.translated?.de).toBe("DE:String 0");
    expect(written.k49?.translated?.de).toBe("DE:String 49");
    expect(written.k50?.translated?.de).toBe("DE:String 50");
  });

  it("keeps plain chunks sequential when uiBatchConcurrency is 1", async () => {
    writePlainCatalog(51);

    let inFlight = 0;
    let maxInFlight = 0;
    const fetchMock = vi
      .fn()
      .mockImplementation((reqUrl: string | URL | Request, init?: RequestInit) => {
        const u = requestUrl(reqUrl);
        if (u.includes("/models")) {
          return Promise.resolve(
            mockJsonResponse({
              data: [{ id: "model-a", pricing: { prompt: "0", completion: "0" } }],
            })
          );
        }
        return (async () => {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await new Promise((resolve) => setTimeout(resolve, 25));
          inFlight -= 1;
          const sources = chatUserSources(init);
          const translations = sources.map((s) => `DE:${s}`);
          return mockJsonResponse({
            id: "r1",
            choices: [
              { message: { content: JSON.stringify(translations) }, finish_reason: "stop" },
            ],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          });
        })();
      });
    vi.stubGlobal("fetch", fetchMock);

    await runTranslateUI(buildConfig(), {
      cwd: tmp,
      locales: ["de"],
      force: false,
      dryRun: false,
      verbose: false,
      uiBatchConcurrency: 1,
    });

    expect(maxInFlight).toBe(1);
    const written = readPlainTranslations();
    expect(written.k0?.translated?.de).toBe("DE:String 0");
    expect(written.k50?.translated?.de).toBe("DE:String 50");
  });
});
