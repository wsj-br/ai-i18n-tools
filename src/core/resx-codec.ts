/**
 * .NET `.resx` reader and writer for source-string catalogs.
 *
 * Keys are the source text. Context uses U+2404 because U+0004 is illegal in XML.
 * Plurals are one `<data>` per CLDR form: `{singular}[{form}]`.
 */
import type { CldrPluralForm, StringsJsonEntry } from "./types.js";
import { isPluralStringsEntry } from "./types.js";
import { uiCatalogHash } from "../extractors/ui-string-locations.js";
import { requiredCldrPluralForms } from "./plural-forms.js";
import { normalizeLocale } from "./locale-utils.js";
import type { IngestedGettextRow } from "./gettext-codec.js";

/** Visible stand-in for the gettext context separator. U+0004 cannot appear in XML 1.0. */
export const RESX_CONTEXT_SEPARATOR = "\u2404";

const CLDR_FORMS: readonly CldrPluralForm[] = ["zero", "one", "two", "few", "many", "other"];
const FORM_SET = new Set<string>(CLDR_FORMS);

export interface ResxDataEntry {
  name: string;
  value: string;
  comment?: string;
  type?: string;
  mimetype?: string;
}

export interface ResxWriteEntry {
  name: string;
  value: string;
  comment?: string;
}

const RESX_HEADER = `<?xml version="1.0" encoding="utf-8"?>
<root>
  <xsd:schema id="root" xmlns="" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:msdata="urn:schemas-microsoft-com:xml-msdata">
    <xsd:import namespace="http://www.w3.org/XML/1998/namespace" />
    <xsd:element name="root" msdata:IsDataSet="true">
      <xsd:complexType>
        <xsd:choice maxOccurs="unbounded">
          <xsd:element name="metadata">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="value" type="xsd:string" minOccurs="0" />
              </xsd:sequence>
              <xsd:attribute name="name" use="required" type="xsd:string" />
              <xsd:attribute name="type" type="xsd:string" />
              <xsd:attribute name="mimetype" type="xsd:string" />
              <xsd:attribute ref="xml:space" />
            </xsd:complexType>
          </xsd:element>
          <xsd:element name="data">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="value" type="xsd:string" minOccurs="0" msdata:Ordinal="1" />
                <xsd:element name="comment" type="xsd:string" minOccurs="0" msdata:Ordinal="2" />
              </xsd:sequence>
              <xsd:attribute name="name" type="xsd:string" use="required" />
              <xsd:attribute name="type" type="xsd:string" />
              <xsd:attribute name="mimetype" type="xsd:string" />
              <xsd:attribute ref="xml:space" />
            </xsd:complexType>
          </xsd:element>
          <xsd:element name="resheader">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="value" type="xsd:string" minOccurs="0" msdata:Ordinal="1" />
              </xsd:sequence>
              <xsd:attribute name="name" type="xsd:string" use="required" />
            </xsd:complexType>
          </xsd:element>
        </xsd:choice>
      </xsd:complexType>
    </xsd:element>
  </xsd:schema>
  <resheader name="resmimetype"><value>text/microsoft-resx</value></resheader>
  <resheader name="version"><value>2.0</value></resheader>
  <resheader name="reader"><value>System.Resources.ResXResourceReader, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value></resheader>
  <resheader name="writer"><value>System.Resources.ResXResourceWriter, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value></resheader>
`;

/** `null` is the neutral file. `undefined` means the file name is not this base name. */
export function resxLocaleFromFileName(
  baseName: string,
  fileName: string
): string | null | undefined {
  if (fileName === `${baseName}.resx`) {
    return null;
  }
  const prefix = `${baseName}.`;
  const suffix = ".resx";
  if (!fileName.startsWith(prefix) || !fileName.endsWith(suffix)) {
    return undefined;
  }
  const culture = fileName.slice(prefix.length, fileName.length - suffix.length);
  if (!culture || culture.includes(".")) {
    return undefined;
  }
  return culture.replace(/_/g, "-");
}

export function resxMessageKey(source: string, context?: string): string {
  const text = source.trim();
  const ctx = context?.trim();
  if (!ctx) {
    return text;
  }
  return `${ctx}${RESX_CONTEXT_SEPARATOR}${text}`;
}

export function pluralResxKey(singular: string, form: CldrPluralForm, context?: string): string {
  return `${resxMessageKey(singular, context)}[${form}]`;
}

export function serializeResx(entries: readonly ResxWriteEntry[]): string {
  const sorted = [...entries].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const body = sorted
    .map((entry) => {
      const comment = entry.comment?.trim()
        ? `\n    <comment>${escapeText(xmlSafe(entry.comment))}</comment>`
        : "";
      return `  <data name="${escapeAttr(xmlSafe(entry.name))}" xml:space="preserve"><value>${escapeText(xmlSafe(entry.value))}</value>${comment}\n  </data>`;
    })
    .join("\n");
  return `${RESX_HEADER}${body}${body ? "\n" : ""}</root>\n`;
}

export function parseResx(xml: string): ResxDataEntry[] {
  const entries: ResxDataEntry[] = [];
  const re = /<data\b([^>]*?)(\/?)>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    const attrs = readAttrs(match[1] ?? "");
    const name = attrs.name;
    if (!name) {
      continue;
    }
    let value = "";
    let comment: string | undefined;
    if (match[2] !== "/") {
      const close = xml.indexOf("</data>", match.index + match[0].length);
      const inner = xml.slice(match.index + match[0].length, close === -1 ? xml.length : close);
      value = elementText(inner, "value") ?? "";
      const commentText = elementText(inner, "comment");
      if (commentText !== undefined && commentText.trim()) {
        comment = commentText;
      }
      if (close !== -1) {
        re.lastIndex = close + "</data>".length;
      }
    }
    entries.push({
      name,
      value,
      ...(comment ? { comment } : {}),
      ...(attrs.type ? { type: attrs.type } : {}),
      ...(attrs.mimetype ? { mimetype: attrs.mimetype } : {}),
    });
  }
  return entries;
}

export function catalogEntriesToResx(
  strings: Record<string, StringsJsonEntry>,
  locale: string,
  options: { neutral: boolean }
): ResxWriteEntry[] {
  const loc = normalizeLocale(locale);
  const out: ResxWriteEntry[] = [];
  for (const entry of Object.values(strings)) {
    const source = entry.source ?? "";
    if (!source.trim()) {
      continue;
    }
    const comment = entryComment(entry);
    if (isPluralStringsEntry(entry)) {
      const forms = options.neutral
        ? neutralPluralForms(entry, loc)
        : translatedPluralForms(entry, loc);
      for (const form of requiredCldrPluralForms(loc)) {
        const text = forms[form];
        if (text === undefined || text.trim() === "") {
          continue;
        }
        out.push({
          name: pluralResxKey(source, form, entry.context),
          value: text,
          ...(comment ? { comment } : {}),
        });
      }
      continue;
    }
    const value = options.neutral ? source : plainTranslation(entry, loc);
    if (value === undefined || value.trim() === "") {
      continue;
    }
    out.push({
      name: resxMessageKey(source, entry.context),
      value,
      ...(comment ? { comment } : {}),
    });
  }
  return out;
}

export interface IngestResxOptions {
  /** Neutral `<data>` rows. Named keys (`LoginButton`) are matched through these values. */
  neutral?: readonly ResxDataEntry[];
}

/** Satellite (or neutral source-only) rows shaped like gettext ingestion. */
export function ingestResxTranslations(
  content: string,
  locale: string,
  options?: IngestResxOptions
): IngestedGettextRow[] {
  const neutralByName = new Map<string, string>();
  for (const row of options?.neutral ?? []) {
    if (row.type || row.mimetype || !row.name) {
      continue;
    }
    neutralByName.set(row.name, row.value);
  }
  const groups = new Map<
    string,
    {
      source: string;
      context?: string;
      plural: boolean;
      pluralSource?: string;
      forms: Partial<Record<CldrPluralForm, string>>;
      text?: string;
      references: Array<{ file: string; line: number }>;
    }
  >();
  for (const row of parseResx(content)) {
    if (row.type || row.mimetype || !row.value.trim()) {
      continue;
    }
    const parsed = parseResxName(row.name, neutralByName);
    if (!parsed) {
      continue;
    }
    const hash = uiCatalogHash(parsed.source, parsed.context);
    const group = groups.get(hash) ?? {
      source: parsed.source,
      ...(parsed.context ? { context: parsed.context } : {}),
      plural: false,
      forms: {},
      references: [],
    };
    const ref = referenceFromComment(row.comment);
    if (ref && !group.references.some((item) => item.file === ref.file && item.line === ref.line)) {
      group.references.push(ref);
    }
    if (parsed.form) {
      group.plural = true;
      group.forms[parsed.form] = row.value;
      if (parsed.form === "other") {
        const neutralOther = neutralByName.get(row.name)?.trim();
        if (neutralOther) {
          group.pluralSource = neutralOther;
        }
      }
    } else {
      group.text = row.value;
    }
    groups.set(hash, group);
  }
  const rows: IngestedGettextRow[] = [];
  for (const [hash, group] of groups) {
    if (group.plural) {
      if (Object.keys(group.forms).length === 0) {
        continue;
      }
      rows.push({
        hash,
        source: group.source,
        ...(group.context ? { context: group.context } : {}),
        ...(group.pluralSource ? { pluralSource: group.pluralSource } : {}),
        plural: true,
        locale,
        translation: group.forms,
        references: group.references,
      });
      continue;
    }
    if (!group.text?.trim()) {
      continue;
    }
    rows.push({
      hash,
      source: group.source,
      ...(group.context ? { context: group.context } : {}),
      plural: false,
      locale,
      translation: group.text,
      references: group.references,
    });
  }
  return rows;
}

function parseResxName(
  name: string,
  neutralByName: Map<string, string>
): { source: string; context?: string; form?: CldrPluralForm } | null {
  let rest = name;
  let context: string | undefined;
  const sep = rest.indexOf(RESX_CONTEXT_SEPARATOR);
  if (sep !== -1) {
    context = rest.slice(0, sep).trim();
    rest = rest.slice(sep + RESX_CONTEXT_SEPARATOR.length);
    if (!context) {
      context = undefined;
    }
  }
  const formMatch = rest.match(/^(.*)\[(zero|one|two|few|many|other)\]$/);
  if (formMatch && FORM_SET.has(formMatch[2] ?? "")) {
    const source = (formMatch[1] ?? "").trim();
    if (!source) {
      return null;
    }
    return { source, ...(context ? { context } : {}), form: formMatch[2] as CldrPluralForm };
  }
  if (!context) {
    const neutral = neutralByName.get(name);
    if (neutral !== undefined && neutral.trim() !== name.trim() && neutral.trim()) {
      return { source: neutral.trim() };
    }
  }
  const source = rest.trim();
  if (!source) {
    return null;
  }
  return { source, ...(context ? { context } : {}) };
}

function referenceFromComment(comment: string | undefined): { file: string; line: number } | null {
  if (!comment) {
    return null;
  }
  for (const line of comment.split(/\r?\n/)) {
    const match = line.trim().match(/^(.*):(\d+)$/);
    if (!match || !match[1] || match[1].startsWith("context")) {
      continue;
    }
    const file = match[1].trim();
    const lineNo = Number(match[2]);
    if (file && Number.isInteger(lineNo) && lineNo > 0) {
      return { file, line: lineNo };
    }
  }
  return null;
}

function entryComment(entry: StringsJsonEntry): string | undefined {
  const lines: string[] = [];
  if (entry.context?.trim()) {
    lines.push(`context: ${entry.context.trim()}`);
  }
  const loc = entry.locations?.[0];
  if (loc) {
    lines.push(`${loc.file}:${loc.line}`);
  }
  return lines.length > 0 ? lines.join("\n") : undefined;
}

function plainTranslation(entry: StringsJsonEntry, locale: string): string | undefined {
  if (isPluralStringsEntry(entry)) {
    return undefined;
  }
  const text = entry.translated?.[locale];
  return typeof text === "string" ? text : undefined;
}

function translatedPluralForms(
  entry: StringsJsonEntry,
  locale: string
): Partial<Record<CldrPluralForm, string>> {
  if (!isPluralStringsEntry(entry)) {
    return {};
  }
  const forms = entry.translated?.[locale];
  return forms && typeof forms === "object" ? forms : {};
}

function neutralPluralForms(
  entry: StringsJsonEntry,
  _locale: string
): Partial<Record<CldrPluralForm, string>> {
  if (!isPluralStringsEntry(entry)) {
    return {};
  }
  const forms: Partial<Record<CldrPluralForm, string>> = {
    one: entry.source,
    other: entry.pluralSource?.trim() ? entry.pluralSource : entry.source,
  };
  return forms;
}

function xmlSafe(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const illegal =
      code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f);
    if (!illegal) {
      out += ch;
    }
  }
  return out;
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/\t/g, "&#x9;")
    .replace(/\n/g, "&#xA;")
    .replace(/\r/g, "&#xD;");
}

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function readAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    const key = match[1] ?? "";
    const local = key.includes(":") ? key.slice(key.indexOf(":") + 1) : key;
    if (local === "space") {
      continue;
    }
    const raw = match[2] ?? match[3] ?? "";
    attrs[local] = decodeEntities(raw);
  }
  return attrs;
}

function elementText(inner: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`);
  const match = inner.match(re);
  if (!match) {
    return undefined;
  }
  return decodeEntities(match[1] ?? "");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => safeCodePoint(parseInt(num, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function safeCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) {
    return "";
  }
  return String.fromCodePoint(code);
}
