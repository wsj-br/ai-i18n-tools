import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const modUrl = pathToFileURL(path.join(repoRoot, "scripts", "vue-braces-for-markdown.mjs")).href;
const { escapeVueBracesInMarkdown } = await import(modUrl);

describe("escapeVueBracesInMarkdown", () => {
  it("wraps inline `{{…}}` without leaving surrounding backticks", () => {
    const out = escapeVueBracesInMarkdown("see `{{SE}}` here");
    expect(out).toBe("see <code v-pre>{{SE}}</code> here");
    expect(out).not.toMatch(/`<code v-pre>/);
  });

  it("keeps fenced code mustaches literal", () => {
    const input = "before\n```md\n{{count}}\n```\nafter `{{SE}}`";
    const out = escapeVueBracesInMarkdown(input);
    expect(out).toContain("```md\n{{count}}\n```");
    expect(out).toContain("<code v-pre>{{SE}}</code>");
  });

  it("does not desync on CommonMark double-backtick spans before mustaches", () => {
    // Regression: naive single-backtick scanning treated `` as empty spans and
    // later replaced `{{…}}` *inside* remaining backticks → Vue parse errors.
    const input =
      "around `` `inline code` `` and `` ` `` then `{{…}}` plus (`{{HTM_N}}`, `{{URL_N}}`); `{{SE}}`.";
    const out = escapeVueBracesInMarkdown(input);
    expect(out).toContain("`` `inline code` ``");
    expect(out).toContain("`` ` ``");
    expect(out).toContain("<code v-pre>{{…}}</code>");
    expect(out).toContain("<code v-pre>{{HTM_N}}</code>");
    expect(out).toContain("<code v-pre>{{URL_N}}</code>");
    expect(out).toContain("<code v-pre>{{SE}}</code>");
    expect(out).not.toMatch(/`<code v-pre>/);
  });

  it("is idempotent on already-escaped v-pre spans", () => {
    const once = escapeVueBracesInMarkdown("token `{{SE}}`");
    const twice = escapeVueBracesInMarkdown(once);
    expect(twice).toBe(once);
  });
});
