/**
 * GNU Gettext `.po` / `.pot` / `.mo` codec.
 *
 * `.mo` files use magic `0x950412de`, revision 0, and original-string tables sorted by
 * raw UTF-8 bytes so `gettext.GNUTranslations` binary search works for non-ASCII keys.
 * Plural slots come from an explicit GNU rule table (`cldrForms.length === nplurals`),
 * not from `Intl.PluralRules` order.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { CldrPluralForm, StringsJsonEntry } from "./types.js";
import { isPluralStringsEntry } from "./types.js";
import { expandPluralFormsForFlatOutput } from "./plural-forms.js";
import { uiCatalogHash, GETTEXT_CONTEXT_SEPARATOR } from "../extractors/ui-string-locations.js";

export interface GnuPluralRule {
  nplurals: number;
  pluralExpr: string;
  cldrForms: CldrPluralForm[];
  index: (n: number) => number;
}

export interface PoEntry {
  comments: string[];
  flags: string[];
  references: string[];
  context?: string;
  msgid: string;
  msgidPlural?: string;
  msgstr: string[];
  fuzzy: boolean;
  obsolete: boolean;
}

export interface PoCatalog {
  entries: PoEntry[];
}

const ONE_OTHER: CldrPluralForm[] = ["one", "other"];

function rule(
  nplurals: number,
  pluralExpr: string,
  cldrForms: CldrPluralForm[],
  index: (n: number) => number
): GnuPluralRule {
  if (cldrForms.length !== nplurals) {
    throw new Error(
      `GNU plural rule ${pluralExpr} has ${cldrForms.length} forms, expected ${nplurals}`
    );
  }
  return { nplurals, pluralExpr, cldrForms, index };
}

const ENGLISH = rule(2, "(n != 1)", ONE_OTHER, (n) => (n === 1 ? 0 : 1));
const FRENCH = rule(2, "(n > 1)", ONE_OTHER, (n) => (n > 1 ? 1 : 0));
const ASIAN = rule(1, "0", ["other"], () => 0);
const RUSSIAN = rule(
  3,
  "(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)",
  ["one", "few", "many"],
  (n) =>
    n % 10 === 1 && n % 100 !== 11
      ? 0
      : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
        ? 1
        : 2
);
const POLISH = rule(
  3,
  "(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)",
  ["one", "few", "many"],
  (n) => (n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2)
);
const CZECH = rule(3, "(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2", ["one", "few", "other"], (n) =>
  n === 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2
);
const SLOVENE = rule(
  4,
  "(n%100==1 ? 0 : n%100==2 ? 1 : n%100==3 || n%100==4 ? 2 : 3)",
  ["one", "two", "few", "other"],
  (n) => (n % 100 === 1 ? 0 : n % 100 === 2 ? 1 : n % 100 === 3 || n % 100 === 4 ? 2 : 3)
);
const IRISH = rule(
  5,
  "(n==1 ? 0 : n==2 ? 1 : n<7 ? 2 : n<11 ? 3 : 4)",
  ["one", "two", "few", "many", "other"],
  (n) => (n === 1 ? 0 : n === 2 ? 1 : n < 7 ? 2 : n < 11 ? 3 : 4)
);
const ARABIC = rule(
  6,
  "(n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 ? 4 : 5)",
  ["zero", "one", "two", "few", "many", "other"],
  (n) =>
    n === 0
      ? 0
      : n === 1
        ? 1
        : n === 2
          ? 2
          : n % 100 >= 3 && n % 100 <= 10
            ? 3
            : n % 100 >= 11
              ? 4
              : 5
);

const RULE_BY_LANGUAGE: Record<string, GnuPluralRule> = {
  ja: ASIAN,
  zh: ASIAN,
  ko: ASIAN,
  vi: ASIAN,
  id: ASIAN,
  th: ASIAN,
  ms: ASIAN,
  en: ENGLISH,
  de: ENGLISH,
  es: ENGLISH,
  it: ENGLISH,
  nl: ENGLISH,
  sv: ENGLISH,
  da: ENGLISH,
  fi: ENGLISH,
  pt: ENGLISH,
  fr: FRENCH,
  ru: RUSSIAN,
  uk: RUSSIAN,
  be: RUSSIAN,
  sr: RUSSIAN,
  hr: RUSSIAN,
  bs: RUSSIAN,
  pl: POLISH,
  cs: CZECH,
  sk: CZECH,
  sl: SLOVENE,
  ga: IRISH,
  ar: ARABIC,
};

/** GNU plural header for a BCP-47 tag. Unknown languages use the English two-form rule. */
export function gnuPluralRule(locale: string): GnuPluralRule {
  const tag = locale.trim().replace(/_/g, "-");
  const lower = tag.toLowerCase();
  if (lower === "pt-br") {
    return FRENCH;
  }
  const language = lower.split("-")[0] ?? lower;
  return RULE_BY_LANGUAGE[language] ?? ENGLISH;
}

export function toGettextLocale(locale: string, format: "posix" | "bcp47"): string {
  const bcp47 = locale.trim().replace(/_/g, "-");
  return format === "posix" ? bcp47.replace(/-/g, "_") : bcp47;
}

export function fromGettextLocale(locale: string): string {
  return locale.trim().replace(/_/g, "-");
}

export function parsePo(content: string): PoCatalog {
  const entries: PoEntry[] = [];
  let comments: string[] = [];
  let flags: string[] = [];
  let references: string[] = [];
  let context: string | undefined;
  let msgid: string | undefined;
  let msgidPlural: string | undefined;
  let msgstr: string[] = [];
  let obsolete = false;
  let field: "msgid" | "msgid_plural" | "msgstr" | "msgctxt" | null = null;
  let msgstrIndex = 0;

  const finish = (): void => {
    if (msgid === undefined && context === undefined && comments.length === 0) {
      return;
    }
    if (msgid === undefined) {
      comments = [];
      flags = [];
      references = [];
      context = undefined;
      obsolete = false;
      return;
    }
    const fuzzy = flags.includes("fuzzy");
    entries.push({
      comments: comments.slice(),
      flags: flags.slice(),
      references: references.slice(),
      ...(context !== undefined && context !== "" ? { context } : {}),
      msgid,
      ...(msgidPlural !== undefined ? { msgidPlural } : {}),
      msgstr: msgstr.length > 0 ? msgstr.slice() : [""],
      fuzzy,
      obsolete,
    });
    comments = [];
    flags = [];
    references = [];
    context = undefined;
    msgid = undefined;
    msgidPlural = undefined;
    msgstr = [];
    obsolete = false;
    field = null;
  };

  const append = (value: string): void => {
    if (field === "msgid") {
      msgid = (msgid ?? "") + value;
    } else if (field === "msgid_plural") {
      msgidPlural = (msgidPlural ?? "") + value;
    } else if (field === "msgctxt") {
      context = (context ?? "") + value;
    } else if (field === "msgstr") {
      msgstr[msgstrIndex] = (msgstr[msgstrIndex] ?? "") + value;
    }
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const obsoleteLine = rawLine.startsWith("#~");
    const line = obsoleteLine ? rawLine.replace(/^#~\s?/, "") : rawLine;
    if (line.trim() === "") {
      finish();
      continue;
    }
    if (obsoleteLine) {
      obsolete = true;
    }
    if (line.startsWith("#,") && !obsoleteLine) {
      flags.push(
        ...line
          .slice(2)
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
      );
      continue;
    }
    if (line.startsWith("#:") && !obsoleteLine) {
      references.push(...line.slice(2).trim().split(/\s+/).filter(Boolean));
      continue;
    }
    if (line.startsWith("#")) {
      comments.push(rawLine);
      continue;
    }
    const keyword = line.match(/^(msgctxt|msgid_plural|msgid|msgstr(?:\[(\d+)\])?)\s*(.*)$/);
    if (keyword) {
      const kind = keyword[1]!;
      const rest = keyword[3] ?? "";
      if (kind === "msgctxt") {
        if (msgid !== undefined) {
          finish();
        }
        field = "msgctxt";
        context = "";
        append(readPoString(rest));
      } else if (kind === "msgid") {
        if (msgid !== undefined) {
          finish();
        }
        field = "msgid";
        msgid = "";
        append(readPoString(rest));
      } else if (kind === "msgid_plural") {
        field = "msgid_plural";
        msgidPlural = "";
        append(readPoString(rest));
      } else {
        field = "msgstr";
        msgstrIndex = keyword[2] ? Number(keyword[2]) : 0;
        msgstr[msgstrIndex] = "";
        append(readPoString(rest));
      }
      continue;
    }
    if (line.trim().startsWith('"')) {
      append(readPoString(line.trim()));
    }
  }
  finish();
  return { entries };
}

export function serializePo(catalog: PoCatalog): string {
  const header = catalog.entries.find((entry) => !entry.obsolete && entry.msgid === "");
  const live = catalog.entries
    .filter((entry) => !entry.obsolete && entry.msgid !== "")
    .slice()
    .sort((a, b) => {
      const ctx = (a.context ?? "").localeCompare(b.context ?? "");
      return ctx !== 0 ? ctx : a.msgid.localeCompare(b.msgid);
    });
  const obsolete = catalog.entries.filter((entry) => entry.obsolete);
  const chunks: string[] = [];
  if (header) {
    chunks.push(serializeEntry(header));
  }
  for (const entry of live) {
    chunks.push(serializeEntry(entry));
  }
  for (const entry of obsolete) {
    chunks.push(serializeEntry(entry));
  }
  return `${chunks.join("\n")}\n`;
}

function serializeEntry(entry: PoEntry): string {
  const lines: string[] = [];
  const prefix = entry.obsolete ? "#~ " : "";
  for (const comment of entry.comments) {
    lines.push(entry.obsolete && !comment.startsWith("#~") ? `#~ ${comment}` : comment);
  }
  if (!entry.obsolete && entry.references.length > 0) {
    lines.push(`#: ${entry.references.join(" ")}`);
  }
  const flags = entry.flags.filter((flag) => flag !== "fuzzy");
  if (entry.fuzzy) {
    flags.unshift("fuzzy");
  }
  if (!entry.obsolete && flags.length > 0) {
    lines.push(`#, ${[...new Set(flags)].join(", ")}`);
  }
  if (entry.context !== undefined) {
    lines.push(`${prefix}msgctxt ${formatPoString(entry.context)}`);
  }
  lines.push(`${prefix}msgid ${formatPoString(entry.msgid)}`);
  if (entry.msgidPlural !== undefined) {
    lines.push(`${prefix}msgid_plural ${formatPoString(entry.msgidPlural)}`);
    entry.msgstr.forEach((value, index) => {
      lines.push(`${prefix}msgstr[${index}] ${formatPoString(value)}`);
    });
  } else {
    lines.push(`${prefix}msgstr ${formatPoString(entry.msgstr[0] ?? "")}`);
  }
  return lines.join("\n");
}

function formatPoString(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
  if (!escaped.includes("\\n") || escaped.length < 60) {
    return `"${escaped}"`;
  }
  const parts = escaped.split("\\n");
  const lines = ['""'];
  parts.forEach((part, index) => {
    const suffix = index < parts.length - 1 ? "\\n" : "";
    if (part.length > 0 || suffix) {
      lines.push(`"${part}${suffix}"`);
    }
  });
  return lines.join("\n");
}

function readPoString(token: string): string {
  const trimmed = token.trim();
  if (!trimmed.startsWith('"')) {
    return "";
  }
  let out = "";
  for (let i = 1; i < trimmed.length; i++) {
    const ch = trimmed[i]!;
    if (ch === '"') {
      break;
    }
    if (ch === "\\" && i + 1 < trimmed.length) {
      const n = trimmed[++i]!;
      if (n === "n") {
        out += "\n";
      } else if (n === "t") {
        out += "\t";
      } else if (n === "r") {
        out += "\r";
      } else if (n === '"') {
        out += '"';
      } else if (n === "\\") {
        out += "\\";
      } else {
        out += n;
      }
      continue;
    }
    out += ch;
  }
  return out;
}

export interface MoMessage {
  id: string;
  str: string;
}

/** Compile a GNU `.mo` buffer. `id` / `str` may contain NUL separators for plurals and context. */
export function compileMo(messages: MoMessage[]): Buffer {
  const unique = new Map<string, Buffer>();
  const strings = new Map<string, Buffer>();
  for (const message of messages) {
    const id = Buffer.from(message.id, "utf8");
    unique.set(message.id, id);
    strings.set(message.id, Buffer.from(message.str, "utf8"));
  }
  const ids = [...unique.entries()].sort((a, b) => Buffer.compare(a[1], b[1]));
  const count = ids.length;
  const headerBytes = 28;
  const keyTable = headerBytes;
  const valueTable = keyTable + count * 8;
  let offset = valueTable + count * 8;
  const keyMeta: Array<{ length: number; offset: number }> = [];
  const valueMeta: Array<{ length: number; offset: number }> = [];
  const blobs: Buffer[] = [];
  for (const [id] of ids) {
    const buf = unique.get(id)!;
    keyMeta.push({ length: buf.length, offset });
    blobs.push(buf, Buffer.from([0]));
    offset += buf.length + 1;
  }
  for (const [id] of ids) {
    const buf = strings.get(id)!;
    valueMeta.push({ length: buf.length, offset });
    blobs.push(buf, Buffer.from([0]));
    offset += buf.length + 1;
  }
  const header = Buffer.alloc(valueTable + count * 8);
  header.writeUInt32LE(0x950412de, 0);
  header.writeUInt32LE(0, 4);
  header.writeUInt32LE(count, 8);
  header.writeUInt32LE(keyTable, 12);
  header.writeUInt32LE(valueTable, 16);
  header.writeUInt32LE(0, 20);
  header.writeUInt32LE(0, 24);
  keyMeta.forEach((meta, index) => {
    const at = keyTable + index * 8;
    header.writeUInt32LE(meta.length, at);
    header.writeUInt32LE(meta.offset, at + 4);
  });
  valueMeta.forEach((meta, index) => {
    const at = valueTable + index * 8;
    header.writeUInt32LE(meta.length, at);
    header.writeUInt32LE(meta.offset, at + 4);
  });
  return Buffer.concat([header, ...blobs]);
}

function messageId(context: string | undefined, msgid: string, plural?: string): string {
  const base = plural !== undefined ? `${msgid}\u0000${plural}` : msgid;
  return context ? `${context}${GETTEXT_CONTEXT_SEPARATOR}${base}` : base;
}

function placeholderFlags(text: string): string[] {
  const flags: string[] = [];
  if (/(?<!%)%(?:\([^)]+\))?[#0\- +]*(?:\d+|\*)?(?:\.(?:\d+|\*))?[diouxXeEfFgGcrsa]/.test(text)) {
    flags.push("python-format");
  }
  if (/\{[A-Za-z_][^}]*\}/.test(text) || /\{\{/.test(text)) {
    flags.push("python-brace-format");
  }
  return flags;
}

function headerMap(msgstr: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of msgstr.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) {
      continue;
    }
    map.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
  }
  return map;
}

function headerString(map: Map<string, string>): string {
  return `${[...map.entries()].map(([key, value]) => `${key}: ${value}`).join("\n")}\n`;
}

export interface BuiltPoEntry {
  context?: string;
  msgid: string;
  msgidPlural?: string;
  msgstr: string[];
  references: string[];
}

export function buildPoCatalog(options: {
  locale: string;
  domain: string;
  entries: BuiltPoEntry[];
  previous?: string | null;
}): PoCatalog {
  const ruleForLocale = gnuPluralRule(options.locale);
  const previous = options.previous ? parsePo(options.previous) : { entries: [] };
  const previousByKey = new Map<string, PoEntry>();
  for (const entry of previous.entries) {
    if (!entry.obsolete) {
      previousByKey.set(`${entry.context ?? ""}\u0000${entry.msgid}`, entry);
    }
  }
  const headerPrev = previous.entries.find((entry) => !entry.obsolete && entry.msgid === "");
  const headers = headerMap(headerPrev?.msgstr[0] ?? "");
  headers.set("Project-Id-Version", headers.get("Project-Id-Version") || `${options.domain}`);
  headers.set("Language", toGettextLocale(options.locale, "posix"));
  headers.set("MIME-Version", "1.0");
  headers.set("Content-Type", "text/plain; charset=UTF-8");
  headers.set("Content-Transfer-Encoding", "8bit");
  headers.set(
    "Plural-Forms",
    `nplurals=${ruleForLocale.nplurals}; plural=${ruleForLocale.pluralExpr};`
  );
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) {
    const iso = new Date(Number(epoch) * 1000).toISOString().replace(/\.\d{3}Z$/, "+0000");
    headers.set("POT-Creation-Date", headers.get("POT-Creation-Date") || iso);
    headers.set("PO-Revision-Date", iso);
  }
  const live: PoEntry[] = [
    {
      comments: headerPrev?.comments ?? [],
      flags: [],
      references: [],
      msgid: "",
      msgstr: [headerString(headers)],
      fuzzy: false,
      obsolete: false,
    },
  ];
  const seen = new Set<string>();
  for (const entry of options.entries) {
    const key = `${entry.context ?? ""}\u0000${entry.msgid}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const prev = previousByKey.get(key);
    const flags = [
      ...(prev?.flags.filter((flag) => flag !== "fuzzy") ?? []),
      ...placeholderFlags(`${entry.msgid}\n${entry.msgidPlural ?? ""}`),
    ];
    live.push({
      comments: prev?.comments ?? [],
      flags,
      references: entry.references,
      ...(entry.context ? { context: entry.context } : {}),
      msgid: entry.msgid,
      ...(entry.msgidPlural !== undefined ? { msgidPlural: entry.msgidPlural } : {}),
      msgstr: entry.msgstr,
      fuzzy: false,
      obsolete: false,
    });
  }
  for (const entry of previous.entries) {
    if (!entry.obsolete) {
      continue;
    }
    live.push(entry);
  }
  for (const entry of previous.entries) {
    if (entry.obsolete || entry.msgid === "") {
      continue;
    }
    const key = `${entry.context ?? ""}\u0000${entry.msgid}`;
    if (seen.has(key)) {
      continue;
    }
    live.push({ ...entry, obsolete: true, flags: entry.flags, msgstr: entry.msgstr });
  }
  return { entries: live };
}

export interface CatalogStrings {
  [hash: string]: StringsJsonEntry;
}

export function poEntriesFromCatalog(strings: CatalogStrings, locale: string): BuiltPoEntry[] {
  const plural = gnuPluralRule(locale);
  const out: BuiltPoEntry[] = [];
  for (const entry of Object.values(strings)) {
    const source = entry.source?.trim();
    if (!source) {
      continue;
    }
    const references = (entry.locations ?? []).map((loc) => `${loc.file}:${loc.line}`);
    if (isPluralStringsEntry(entry)) {
      const expanded = expandPluralFormsForFlatOutput(entry.translated?.[locale], locale);
      const forms = plural.cldrForms.map((form) => expanded[form] ?? entry.pluralSource ?? source);
      out.push({
        ...(entry.context ? { context: entry.context } : {}),
        msgid: source,
        msgidPlural: entry.pluralSource ?? source,
        msgstr: forms,
        references,
      });
      continue;
    }
    const translated = entry.translated?.[locale];
    out.push({
      ...(entry.context ? { context: entry.context } : {}),
      msgid: source,
      msgstr: [typeof translated === "string" ? translated : ""],
      references,
    });
  }
  return out;
}

export function moMessagesFromCatalog(strings: CatalogStrings, locale: string): MoMessage[] {
  const entries = poEntriesFromCatalog(strings, locale);
  const header = buildPoCatalog({ locale, domain: "messages", entries }).entries.find(
    (entry) => entry.msgid === ""
  );
  const messages: MoMessage[] = [{ id: "", str: header?.msgstr[0] ?? "" }];
  for (const entry of entries) {
    const plural = entry.msgidPlural;
    messages.push({
      id: messageId(entry.context, entry.msgid, plural),
      str: plural !== undefined ? entry.msgstr.join("\u0000") : (entry.msgstr[0] ?? ""),
    });
  }
  return messages;
}

export interface IngestedGettextRow {
  hash: string;
  source: string;
  context?: string;
  pluralSource?: string;
  plural: boolean;
  locale: string;
  translation: string | Partial<Record<CldrPluralForm, string>>;
  references: Array<{ file: string; line: number }>;
}

/** Non-fuzzy, non-empty translations from a `.po` / `.pot` file. */
export function ingestPoTranslations(content: string, locale: string): IngestedGettextRow[] {
  const catalog = parsePo(content);
  const plural = gnuPluralRule(locale);
  const rows: IngestedGettextRow[] = [];
  for (const entry of catalog.entries) {
    if (entry.obsolete || entry.fuzzy || entry.msgid === "") {
      continue;
    }
    const references = entry.references.flatMap((ref) => {
      const match = ref.match(/^(.*):(\d+)$/);
      if (!match) {
        return [];
      }
      return [{ file: match[1]!, line: Number(match[2]) }];
    });
    if (entry.msgidPlural !== undefined) {
      const forms: Partial<Record<CldrPluralForm, string>> = {};
      let any = false;
      plural.cldrForms.forEach((form, index) => {
        const text = entry.msgstr[index] ?? "";
        if (text.trim()) {
          forms[form] = text;
          any = true;
        }
      });
      if (!any) {
        continue;
      }
      rows.push({
        hash: uiCatalogHash(entry.msgid, entry.context),
        source: entry.msgid,
        ...(entry.context ? { context: entry.context } : {}),
        pluralSource: entry.msgidPlural,
        plural: true,
        locale,
        translation: forms,
        references,
      });
      continue;
    }
    const text = entry.msgstr[0] ?? "";
    if (!text.trim()) {
      continue;
    }
    rows.push({
      hash: uiCatalogHash(entry.msgid, entry.context),
      source: entry.msgid,
      ...(entry.context ? { context: entry.context } : {}),
      plural: false,
      locale,
      translation: text,
      references,
    });
  }
  return rows;
}

export function listExistingPoFiles(
  cwd: string,
  outputDir: string,
  domain: string,
  potPath?: string
): Array<{ file: string; locale: string }> {
  const out: Array<{ file: string; locale: string }> = [];
  const root = path.resolve(cwd, outputDir);
  if (fs.existsSync(root)) {
    for (const localeDir of fs.readdirSync(root, { withFileTypes: true })) {
      if (!localeDir.isDirectory()) {
        continue;
      }
      const po = path.join(root, localeDir.name, "LC_MESSAGES", `${domain}.po`);
      if (fs.existsSync(po)) {
        out.push({ file: po, locale: fromGettextLocale(localeDir.name) });
      }
    }
  }
  if (potPath) {
    const abs = path.resolve(cwd, potPath);
    if (fs.existsSync(abs)) {
      out.push({ file: abs, locale: "" });
    }
  }
  return out;
}

export function writeAtomicBuffer(filePath: string, data: Buffer): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`
  );
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, filePath);
}
