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
});
