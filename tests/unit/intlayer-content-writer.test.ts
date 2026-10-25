import { describe, expect, it } from "vitest";
import { writeIntlayerContentFile } from "../../src/extractors/intlayer-content-writer.js";

const DICT = `import { t, type Dictionary } from "intlayer";

export default {
  key: "dashboard",
  content: {
    heading: t({
      en: "Overview",
      de: "Übersicht",
    }),
    servers: t({
      en: "Servers",
    }),
    nested: {
      deep: t({ en: "Deep", de: "Tief" }),
    },
  },
} satisfies Dictionary;
`;

describe("writeIntlayerContentFile", () => {
  it("inserts a missing locale into a multiline t() leaf, preserving indentation", () => {
    const result = writeIntlayerContentFile(DICT, [
      { dotPath: "servers", localeKey: "de", text: "Server" },
    ]);
    expect(result.changed).toBe(true);
    expect(result.appliedDotPaths).toEqual(["servers"]);
    expect(result.output).toContain(`servers: t({\n      en: "Servers",\n      de: "Server",\n    })`);
    expect(result.missingDotPaths).toEqual([]);
  });

  it("inserts into a single-line t() leaf", () => {
    const result = writeIntlayerContentFile(DICT, [
      { dotPath: "nested.deep", localeKey: "fr", text: "Profond" },
    ]);
    expect(result.changed).toBe(true);
    expect(result.output).toContain(`t({ en: "Deep", de: "Tief", fr: "Profond" })`);
  });

  it("overwrites an existing locale value in place", () => {
    const result = writeIntlayerContentFile(DICT, [
      { dotPath: "heading", localeKey: "de", text: "Neue Übersicht" },
    ]);
    expect(result.changed).toBe(true);
    expect(result.output).toContain(`de: "Neue Übersicht"`);
    expect(result.output).not.toContain(`de: "Übersicht"`);
  });

  it("wraps inserted values in insert() when the leaf uses insertion nodes", () => {
    const src = `export default {
  key: "app",
  content: {
    greeting: t({
      en: insert("Welcome back, {{name}}"),
      "pt-BR": insert("Bem-vindo, {{name}}"),
    }),
  },
};
`;
    const result = writeIntlayerContentFile(src, [
      { dotPath: "greeting", localeKey: "es", text: "Bienvenido, {{name}}" },
    ]);
    expect(result.changed).toBe(true);
    expect(result.output).toContain(`es: insert("Bienvenido, {{name}}"),`);
  });

  it("overwrites only the string inside an existing insert() call", () => {
    const src = `export default {
  key: "app",
  content: {
    greeting: t({ en: insert("Hi {{name}}"), es: insert("Hola {{name}}") }),
  },
};
`;
    const result = writeIntlayerContentFile(src, [
      { dotPath: "greeting", localeKey: "es", text: "Buenas, {{name}}" },
    ]);
    expect(result.output).toContain(`es: insert("Buenas, {{name}}")`);
    expect(result.output).not.toContain("Hola");
    expect(result.output.match(/insert\(/g)).toHaveLength(2);
  });

  it("keeps plain string leaves unwrapped next to insertion leaves", () => {
    const src = `export default {
  key: "app",
  content: {
    plain: t({ en: "Hello" }),
    greeting: t({ en: insert("Hi {{name}}") }),
  },
};
`;
    const result = writeIntlayerContentFile(src, [
      { dotPath: "plain", localeKey: "es", text: "Hola" },
    ]);
    expect(result.output).toContain(`plain: t({ en: "Hello", es: "Hola" })`);
  });

  it("quotes non-identifier locale keys", () => {
    const result = writeIntlayerContentFile(DICT, [
      { dotPath: "servers", localeKey: "pt-BR", text: "Servidores" },
    ]);
    expect(result.output).toContain(`"pt-BR": "Servidores"`);
  });

  it("escapes special characters in the value", () => {
    const result = writeIntlayerContentFile(DICT, [
      { dotPath: "servers", localeKey: "de", text: 'Say "hi"\nnow' },
    ]);
    expect(result.output).toContain(`de: "Say \\"hi\\"\\nnow"`);
  });

  it("applies several updates across leaves in one pass", () => {
    const result = writeIntlayerContentFile(DICT, [
      { dotPath: "heading", localeKey: "fr", text: "Aperçu" },
      { dotPath: "servers", localeKey: "fr", text: "Serveurs" },
    ]);
    expect(result.changed).toBe(true);
    expect(result.appliedDotPaths.sort()).toEqual(["heading", "servers"]);
    expect(result.output).toContain(`fr: "Aperçu"`);
    expect(result.output).toContain(`fr: "Serveurs"`);
  });

  it("reports dot-paths not present as t() leaves", () => {
    const result = writeIntlayerContentFile(DICT, [
      { dotPath: "does.not.exist", localeKey: "de", text: "x" },
    ]);
    expect(result.changed).toBe(false);
    expect(result.missingDotPaths).toEqual(["does.not.exist"]);
    expect(result.output).toBe(DICT);
  });

  it("returns the input unchanged for no updates", () => {
    const result = writeIntlayerContentFile(DICT, []);
    expect(result.changed).toBe(false);
    expect(result.output).toBe(DICT);
  });

  it("leaves unrelated leaves byte-identical", () => {
    const result = writeIntlayerContentFile(DICT, [
      { dotPath: "servers", localeKey: "de", text: "Server" },
    ]);
    expect(result.output).toContain(`heading: t({\n      en: "Overview",\n      de: "Übersicht",\n    })`);
  });
});
