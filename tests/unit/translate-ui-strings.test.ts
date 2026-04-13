import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import { USER_EDITED_MODEL } from "../../src/core/user-edited-model.js";
import { runTranslateUI } from "../../src/cli/translate-ui-strings.js";

function mockJsonResponse(data: object, status = 200) {
  const raw = JSON.stringify(data);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (_name: string) => null as string | null },
    text: async () => raw,
  };
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
        sourceRoots: [],
        stringsJson: "strings.json",
        flatOutputDir: "locales",
      },
      cacheDir: ".translation-cache",
      documentations: [{ contentPaths: [], outputDir: "./i18n" }],
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        translationModels: ["model-a"],
        maxTokens: 100,
        temperature: 0,
      },
      features: {
        extractUIStrings: false,
        translateUIStrings: true,
        translateMarkdown: false,
        translateJSON: false,
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
      [
        "Original language string,locale,Translation",
        "Save,de,Speichern",
      ].join("\n"),
      "utf8"
    );

    const fetchMock = vi.fn().mockResolvedValue(
      mockJsonResponse({
        id: "r1",
        choices: [{ message: { content: '["Speichern","Konto schliessen"]' }, finish_reason: "stop" }],
        usage: {
          prompt_tokens: 1,
          completion_tokens: 2,
          total_tokens: 3,
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await runTranslateUI(buildConfig(), {
      cwd: tmp,
      locales: ["de"],
      force: false,
      dryRun: false,
      verbose: false,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1] as { body?: string } | undefined;
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
