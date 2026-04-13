import path from "path";
import {
  resolveCacheTrackingKeyToAbs,
  SVG_ASSETS_PREFIX,
} from "../../src/core/cache-tracking-keys.js";
import { documentationFileTrackingKey } from "../../src/core/doc-file-tracking.js";

describe("cache-tracking-keys", () => {
  const root = path.resolve("/proj/root");

  it("resolves svg-assets: prefix to project-relative path", () => {
    const key = `${SVG_ASSETS_PREFIX}images/x.svg`;
    expect(resolveCacheTrackingKeyToAbs(root, key)).toBe(path.resolve(root, "images/x.svg"));
  });

  it("delegates doc-block keys to doc-file-tracking", () => {
    const key = documentationFileTrackingKey(0, "docs/a.md");
    expect(resolveCacheTrackingKeyToAbs(root, key)).toBe(path.resolve(root, "docs/a.md"));
  });

  it("resolves plain paths relative to project root", () => {
    expect(resolveCacheTrackingKeyToAbs(root, "readme.md")).toBe(path.resolve(root, "readme.md"));
  });
});
