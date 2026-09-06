import { describe, expect, it } from "vitest";
import {
  pluralFormPlaceholderIssues,
  type PluralPlaceholderIssueKind,
} from "../../src/core/plural-placeholders.js";
import type { CldrPluralForm } from "../../src/core/types.js";

type Case = {
  id: string;
  source: string;
  zeroDigit?: boolean;
  forms: Partial<Record<CldrPluralForm, string>>;
  want: "pass" | PluralPlaceholderIssueKind[];
};

function kindsOf(
  source: string,
  forms: Partial<Record<CldrPluralForm, string>>,
  zeroDigit?: boolean
) {
  return [
    ...new Set(pluralFormPlaceholderIssues(source, forms, { zeroDigit }).map((i) => i.kind)),
  ].sort();
}

const cases: Case[] = [
  // §1 observed
  {
    id: "1.1.bad",
    source: "Merge Selected Servers ({{count}})",
    forms: { one: "Merge Selected Server", other: "Merge Selected Servers ({{count}})" },
    want: ["missing"],
  },
  {
    id: "1.1.good",
    source: "Merge Selected Servers ({{count}})",
    forms: {
      one: "Merge Selected Server ({{count}})",
      other: "Merge Selected Servers ({{count}})",
    },
    want: "pass",
  },
  {
    id: "1.2.bad",
    source: "Minutes",
    forms: { one: "1 minute", other: "{{count}} minutes" },
    want: ["extra", "qty"],
  },
  {
    id: "1.2.good",
    source: "Minutes",
    forms: { one: "Minute", other: "Minutes" },
    want: "pass",
  },
  {
    id: "1.3.Hours.pass",
    source: "Hours",
    forms: { one: "Hour", other: "Hours" },
    want: "pass",
  },
  {
    id: "1.3.Hours.bad-qty",
    source: "Hours",
    forms: { one: "1 hour", other: "{{count}} hours" },
    want: ["extra", "qty"],
  },
  {
    id: "1.4.pass",
    source: "Showing all messages ({{count}})",
    forms: {
      one: "Showing all message ({{count}})",
      other: "Showing all messages ({{count}})",
    },
    want: "pass",
  },
  {
    id: "1.5.pass",
    source: "sent {{count}} notifications.",
    forms: {
      one: "sent {{count}} notification",
      other: "sent {{count}} notifications.",
    },
    want: "pass",
  },

  // §2 noun-only units
  ...(["Minutes", "Hours", "Days", "Weeks", "Months", "Years"] as const).flatMap((unit) => {
    const singular = unit.slice(0, -1);
    return [
      {
        id: `2.${unit}.good`,
        source: unit,
        forms: { one: singular, other: unit },
        want: "pass" as const,
      },
      {
        id: `2.${unit}.bad-qty`,
        source: unit,
        forms: { one: `1 ${singular.toLowerCase()}`, other: `{{count}} ${unit.toLowerCase()}` },
        want: ["extra", "qty"] as PluralPlaceholderIssueKind[],
      },
    ];
  }),
  {
    id: "2.item.good",
    source: "item",
    forms: { one: "item", other: "items" },
    want: "pass",
  },
  {
    id: "2.item.bad",
    source: "item",
    forms: { one: "1 item", other: "{{count}} items" },
    want: ["extra", "qty"],
  },
  {
    id: "2.file.bad",
    source: "file",
    forms: { one: "file", other: "{{count}} file" },
    want: ["extra", "qty"],
  },
  {
    id: "2.Server.bad",
    source: "Server",
    forms: { one: "Server", other: "{{count}} Servers" },
    want: ["extra", "qty"],
  },
  {
    id: "2.row.bad",
    source: "row",
    forms: { one: "row", other: "{{count}} row" },
    want: ["extra", "qty"],
  },
  {
    id: "2.passB.de.good",
    source: "Minutes",
    forms: { one: "Minute", other: "Minuten" },
    want: "pass",
  },
  {
    id: "2.passB.fr.good",
    source: "Minutes",
    forms: { one: "Minute", other: "Minutes" },
    want: "pass",
  },
  {
    id: "2.passB.es.good",
    source: "Minutes",
    forms: { one: "Minuto", other: "Minutos" },
    want: "pass",
  },
  {
    id: "2.passB.zh-Hans.good",
    source: "Minutes",
    forms: { other: "分钟" },
    want: "pass",
  },
  {
    id: "2.passB.de.bad",
    source: "Minutes",
    forms: { one: "1 Minute", other: "{{count}} Minuten" },
    want: ["extra", "qty"],
  },

  // §3 {{count}} only — sample of duplistatus labels
  {
    id: "3.backups-selected.good",
    source: "{{count}} backups selected",
    forms: {
      one: "{{count}} backup selected",
      other: "{{count}} backups selected",
    },
    want: "pass",
  },
  {
    id: "3.backups-selected.bad",
    source: "{{count}} backups selected",
    forms: { one: "backup selected", other: "{{count}} backups selected" },
    want: ["missing"],
  },
  {
    id: "3.backups.good",
    source: "{{count}} backups",
    forms: { one: "{{count}} backup", other: "{{count}} backups" },
    want: "pass",
  },
  {
    id: "3.backups.bad-literal-1",
    source: "{{count}} backups",
    forms: { one: "1 backup", other: "{{count}} backups" },
    want: ["missing"],
  },
  {
    id: "3.rows.identical.pass",
    source: "{{count}} rows",
    forms: { one: "{{count}} rows", other: "{{count}} rows" },
    want: "pass",
  },
  {
    id: "3.servers.parens.good",
    source: "({{count}} servers)",
    forms: { one: "({{count}} server)", other: "({{count}} servers)" },
    want: "pass",
  },
  {
    id: "3.servers.parens.bad",
    source: "({{count}} servers)",
    forms: { one: "(servers)", other: "({{count}} servers)" },
    want: ["missing"],
  },
  {
    id: "3.renamed.n",
    source: "{{count}} backups selected",
    forms: { one: "{{n}} backup selected", other: "{{count}} backups selected" },
    want: ["extra", "missing"],
  },
  {
    id: "3.renamed.Count",
    source: "{{count}} backups selected",
    forms: { one: "{{Count}} backup selected", other: "{{count}} backups selected" },
    want: ["extra", "missing"],
  },
  {
    id: "3.long.merge.keep-count.pass",
    source:
      "This will merge {{count}} server groups. For each group, all old server IDs will be merged into the target server.",
    forms: {
      one: "This will merge {{count}} server group. For each group, all old server IDs will be merged into the target server.",
      other:
        "This will merge {{count}} server groups. For each group, all old server IDs will be merged into the target servers.",
    },
    want: "pass",
  },
  {
    id: "3.long.merge.drop-count",
    source:
      "This will merge {{count}} server groups. For each group, all old server IDs will be merged into the target server.",
    forms: {
      one: "This will merge server group. For each group, all old server IDs will be merged into the target server.",
      other:
        "This will merge {{count}} server groups. For each group, all old server IDs will be merged into the target server.",
    },
    want: ["missing"],
  },

  // §4 multi-placeholder
  {
    id: "4.shown-count.good",
    source: "Showing only the first {{shown}} of {{count}} messages",
    forms: {
      one: "Showing only the first {{shown}} of {{count}} message",
      other: "Showing only the first {{shown}} of {{count}} messages",
    },
    want: "pass",
  },
  {
    id: "4.shown-count.drop-shown",
    source: "Showing only the first {{shown}} of {{count}} messages",
    forms: {
      one: "Showing only the first of {{count}} message",
      other: "Showing only the first {{shown}} of {{count}} messages",
    },
    want: ["missing"],
  },
  {
    id: "4.success-failed.good",
    source: "Tested {{count}} connections: {{success}} successful, {{failed}} failed",
    forms: {
      one: "Tested {{count}} connection: {{success}} successful, {{failed}} failed",
      other: "Tested {{count}} connections: {{success}} successful, {{failed}} failed",
    },
    want: "pass",
  },
  {
    id: "4.success-failed.drop-failed",
    source: "Tested {{count}} connections: {{success}} successful, {{failed}} failed",
    forms: {
      one: "Tested {{count}} connection: {{success}} successful",
      other: "Tested {{count}} connections: {{success}} successful, {{failed}} failed",
    },
    want: ["missing"],
  },
  {
    id: "4.duplicate-count.occ",
    source: "{{count}} of {{count}} items",
    forms: { one: "{{count}} items", other: "{{count}} of {{count}} items" },
    want: ["missing"],
  },
  {
    id: "4.duplicate-count.good",
    source: "{{count}} of {{count}} items",
    forms: {
      one: "{{count}} of {{count}} item",
      other: "{{count}} of {{count}} items",
    },
    want: "pass",
  },

  // §5 wrapT pages
  {
    id: "5.pages.good",
    source: "{{pages}} pages",
    forms: { one: "{{pages}} page", other: "{{pages}} pages" },
    want: "pass",
  },
  {
    id: "5.pages.renamed-count",
    source: "{{pages}} pages",
    forms: { one: "{{count}} page", other: "{{pages}} pages" },
    want: ["extra", "missing", "qty"],
  },
  {
    id: "5.pages.extra-count",
    source: "{{pages}} pages",
    forms: { one: "{{pages}} {{count}} page", other: "{{pages}} pages" },
    want: ["extra", "qty"],
  },

  // §6 whitespace / case
  {
    id: "6.trim-inner.pass",
    source: "{{count}} items",
    forms: { one: "{{ count }} item", other: "{{count}} items" },
    want: "pass",
  },
  {
    id: "6.case.fail",
    source: "{{count}} items",
    forms: { one: "{{Count}} item", other: "{{count}} items" },
    want: ["extra", "missing"],
  },
  {
    id: "6.name.pass",
    source: "Hello {{name}}",
    forms: { one: "Hello {{name}}", other: "Hello {{name}}" },
    want: "pass",
  },

  // §7 other styles
  {
    id: "7.printf.good",
    source: "%d files selected",
    forms: { one: "%d file selected", other: "%d files selected" },
    want: "pass",
  },
  {
    id: "7.printf.bad",
    source: "%d files selected",
    forms: { one: "files selected", other: "%s files selected" },
    want: ["extra", "missing"],
  },
  {
    id: "7.positional.good",
    source: "{0} items in cart",
    forms: { one: "{0} item in cart", other: "{0} items in cart" },
    want: "pass",
  },
  {
    id: "7.positional.bad",
    source: "{0} items in cart",
    forms: { one: "{1} item in cart", other: "items in cart" },
    want: ["extra", "missing"],
  },
  {
    id: "7.page-pct.occ",
    source: "Page %d of %d",
    forms: { one: "Page %d", other: "Page %d of %d" },
    want: ["missing"],
  },
  {
    id: "7.mixed.good",
    source: "Hello {{name}}, %d messages",
    forms: {
      one: "Hello {{name}}, %d message",
      other: "Hello {{name}}, %d messages",
    },
    want: "pass",
  },
  {
    id: "7.mixed.drop",
    source: "Hello {{name}}, %d messages",
    forms: { one: "Hello {{name}}", other: "Hello {{name}}, %d messages" },
    want: ["missing"],
  },

  // §8 zeroDigit
  {
    id: "8.zeroDigit.false.drop-count",
    source: "You have {{count}} items",
    zeroDigit: false,
    forms: {
      zero: "You have no items",
      one: "You have {{count}} item",
      other: "You have {{count}} items",
    },
    want: ["missing"],
  },
  {
    id: "8.zeroDigit.false.keep-count",
    source: "You have {{count}} items",
    zeroDigit: false,
    forms: {
      zero: "You have {{count}} items",
      one: "You have {{count}} item",
      other: "You have {{count}} items",
    },
    want: "pass",
  },
  {
    id: "8.zeroDigit.zero-ok",
    source: "You have {{count}} items",
    zeroDigit: true,
    forms: {
      zero: "You have 0 items",
      one: "You have {{count}} item",
      other: "You have {{count}} items",
    },
    want: "pass",
  },
  {
    id: "8.zeroDigit.one-has-0",
    source: "You have {{count}} items",
    zeroDigit: true,
    forms: {
      zero: "You have 0 items",
      one: "You have 0 items",
      other: "You have {{count}} items",
    },
    want: ["missing"],
  },
  {
    id: "8.zeroDigit.noun-zero-ok",
    source: "Minutes",
    zeroDigit: true,
    forms: { zero: "0 minutes", one: "Minute", other: "Minutes" },
    want: "pass",
  },
  {
    id: "8.zeroDigit.noun-one-0",
    source: "Minutes",
    zeroDigit: true,
    forms: { zero: "0 minutes", one: "0 minute", other: "Minutes" },
    want: ["qty"],
  },

  // §9 extra CLDR
  {
    id: "9.ar.few-keep",
    source: "{{count}} items",
    forms: {
      zero: "{{count}} items",
      one: "{{count}} item",
      two: "{{count}} items",
      few: "{{count}} items",
      many: "{{count}} items",
      other: "{{count}} items",
    },
    want: "pass",
  },
  {
    id: "9.ar.few-drop",
    source: "{{count}} items",
    forms: {
      zero: "{{count}} items",
      one: "{{count}} item",
      two: "{{count}} items",
      few: "items",
      many: "{{n}} items",
      other: "{{count}} items",
    },
    want: ["extra", "missing"],
  },
  {
    id: "9.fr.many.extra",
    source: "Minutes",
    forms: { one: "Minute", many: "{{count}} minutes", other: "Minutes" },
    want: ["extra", "qty"],
  },
  {
    id: "9.fr.many.pass",
    source: "Minutes",
    forms: { one: "Minute", many: "Minutes", other: "Minutes" },
    want: "pass",
  },
  {
    id: "9.zh-Hans.other-only",
    source: "{{count}} items",
    forms: { other: "{{count}} items" },
    want: "pass",
  },

  // §10 Pass B vs original
  {
    id: "10.passB.de-merge",
    source: "Merge Selected Servers ({{count}})",
    forms: {
      one: "Ausgewählten Server zusammenführen",
      other: "Ausgewählte Server zusammenführen ({{count}})",
    },
    want: ["missing"],
  },
  {
    id: "10.poisoned-step0-cannot-authorize",
    source: "Merge Selected Servers ({{count}})",
    forms: { one: "Mesclar Servidor Selecionado", other: "Mesclar Servidores Selecionados" },
    want: ["missing"],
  },
  {
    id: "10.hi.minutes.extra",
    source: "Minutes",
    forms: { one: "मिनट", other: "{{count}} मिनट" },
    want: ["extra", "qty"],
  },

  // §11 false positives
  {
    id: "11.ellipsis.pass",
    source: "Collecting from {{count}} servers...",
    forms: {
      one: "Collecting from {{count}} server",
      other: "Collecting from {{count}} servers...",
    },
    want: "pass",
  },
  {
    id: "11.verb-agreement.pass",
    source: "All {{count}} backups now inherit from server defaults",
    forms: {
      one: "All {{count}} backup now inherits from server defaults",
      other: "All {{count}} backups now inherit from server defaults",
    },
    want: "pass",
  },
  {
    id: "11.hedge.pass",
    source: "Updated {{count}} backups",
    forms: {
      one: "Updated {{count}} backup(s)",
      other: "Updated {{count}} backups",
    },
    want: "pass",
  },

  // §12 qty heuristics
  {
    id: "12.one-word.not-qty",
    source: "Minutes",
    forms: { one: "one minute", other: "Minutes" },
    want: "pass",
  },
  {
    id: "12.article.pass",
    source: "Minutes",
    forms: { one: "a minute", other: "Minutes" },
    want: "pass",
  },
  {
    id: "12.count-source.literal-1-is-missing",
    source: "{{count}} backups",
    forms: { one: "1 backup", other: "{{count}} backups" },
    want: ["missing"],
  },
];

describe("pluralFormPlaceholderIssues corpus", () => {
  it.each(cases)("$id", (c) => {
    const got = kindsOf(c.source, c.forms, c.zeroDigit);
    if (c.want === "pass") {
      expect(got).toEqual([]);
    } else {
      expect(got).toEqual([...c.want].sort());
    }
  });
});
