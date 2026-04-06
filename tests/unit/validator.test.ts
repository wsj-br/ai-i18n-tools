import { validateTranslation } from "../../src/processors/validator";
import type { Segment } from "../../src/core/types";

function S(partial: Partial<Segment> & Pick<Segment, "content" | "type" | "hash">): Segment {
  return {
    id: "1",
    type: partial.type,
    content: partial.content,
    hash: partial.hash,
    translatable: partial.translatable ?? true,
    ...partial,
  };
}

describe("validateTranslation", () => {
  it("flags code change as error", () => {
    const src = [S({ type: "code", content: "```\na\n```", hash: "1", translatable: false })];
    const tr = [S({ type: "code", content: "```\nb\n```", hash: "1", translatable: false })];
    const v = validateTranslation(src, tr);
    expect(v.valid).toBe(false);
    expect(v.errors.length).toBeGreaterThan(0);
  });

  it("passes identical segments", () => {
    const s = [S({ type: "paragraph", content: "Hi", hash: "h" })];
    const v = validateTranslation(s, s);
    expect(v.valid).toBe(true);
  });
});
