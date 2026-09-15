import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  llmClientDebugFailedOpts,
  translationFailureLogDir,
  writeTranslationFailureLog,
} from "../../src/cli/translation-failure-log.js";

describe("translationFailureLogDir", () => {
  it("returns null when debugFailed is off", () => {
    expect(translationFailureLogDir({ cwd: "/tmp/proj", debugFailed: false }, ".cache")).toBeNull();
    expect(translationFailureLogDir({ cwd: "/tmp/proj" }, ".cache")).toBeNull();
  });

  it("joins cwd and cacheDir when debugFailed is on", () => {
    expect(translationFailureLogDir({ cwd: "/tmp/proj", debugFailed: true }, ".cache")).toBe(
      path.join("/tmp/proj", ".cache")
    );
  });
});

describe("llmClientDebugFailedOpts", () => {
  it("omits debugFailedDir when the flag is off", () => {
    expect(llmClientDebugFailedOpts({ cwd: "/tmp/proj" }, ".cache")).toEqual({});
    expect(llmClientDebugFailedOpts({ cwd: "/tmp/proj", debugFailed: false }, ".cache")).toEqual(
      {}
    );
  });

  it("sets debugFailedDir when the flag is on", () => {
    expect(llmClientDebugFailedOpts({ cwd: "/tmp/proj", debugFailed: true }, ".cache")).toEqual({
      debugFailedDir: path.join("/tmp/proj", ".cache"),
    });
  });
});

describe("writeTranslationFailureLog", () => {
  let tmp: string;

  afterEach(() => {
    if (tmp) {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("writes prompt, raw output, verification, and translated text", () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fail-log-"));
    const abs = writeTranslationFailureLog({
      cacheDirAbs: tmp,
      relativePath: "src/locales/strings.json",
      locale: "hi",
      segmentsLabel: "plain chunk 1/1",
      outcome: "fatal",
      failedModel: "model-a",
      qualityErrors: ["wrong script"],
      perSegmentLines: ["0: romanized"],
      systemPrompt: "SYSTEM",
      userContent: "USER",
      rawAssistantContent: "Namaste",
      translatedText: "नमस्ते",
    });
    expect(abs).toBeTruthy();
    const text = fs.readFileSync(abs!, "utf8");
    expect(text).toContain("=== ai-i18n-tools translation failure ===");
    expect(text).toContain("locale: hi");
    expect(text).toContain("--- system prompt ---");
    expect(text).toContain("SYSTEM");
    expect(text).toContain("--- user content ---");
    expect(text).toContain("USER");
    expect(text).toContain("--- raw assistant response ---");
    expect(text).toContain("Namaste");
    expect(text).toContain("--- quality / validation errors ---");
    expect(text).toContain("wrong script");
    expect(text).toContain("--- translated text ---");
    expect(text).toContain("नमस्ते");
    expect(text).toContain("FAILED-TRANSLATION");
  });
});
