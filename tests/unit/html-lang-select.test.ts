/// <reference lib="dom" />
/**
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

const SOURCE = readFileSync(path.join(process.cwd(), "src/html-runtime/lang-select.js"), "utf8");

describe("lang-select.js", () => {
  it("navigates to the selected option and ignores a second bind", () => {
    document.body.innerHTML =
      '<select data-lang-select><option value="/en/">English</option><option value="/pt-BR/">Português</option></select>';
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    });
    window.eval(SOURCE);
    const select = document.querySelector("select")!;
    select.value = "/pt-BR/";
    select.dispatchEvent(new Event("change"));
    expect(assign).toHaveBeenCalledWith("/pt-BR/");
    expect(select.hasAttribute("data-lang-select-bound")).toBe(true);
    window.eval(SOURCE);
    select.dispatchEvent(new Event("change"));
    expect(assign).toHaveBeenCalledTimes(2);
  });
});
