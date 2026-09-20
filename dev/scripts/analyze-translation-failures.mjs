#!/usr/bin/env node
/**
 * Summarize --debug-failed translation logs and rank non-timeout causes.
 *
 * Usage:
 *   pnpm analyze:translation-failures -- failures.tmp
 *   pnpm analyze:translation-failures -- failures.tmp --json
 */

import fs from "node:fs";
import path from "node:path";

const TIMEOUT_RE = /\b(?:timeout|timed out|ETIMEDOUT|deadline exceeded)\b/i;
const QUALITY_SECTION_RE =
  /--- quality \/ validation errors ---\n([\s\S]*?)(?=\n--- per-segment validation ---)/;
const HASH_RE = /\(hash ([^)]+)\)/;

const CATEGORY_RULES = [
  {
    name: "placeholder inventory",
    match: (error) => /^Translation placeholder inventory mismatch/.test(error),
    assessment: "model output dropped, duplicated, or changed protected tokens",
  },
  {
    name: "invalid batch JSON",
    match: (error) => /^Document batch .*invalid JSON/.test(error),
    assessment: "model returned malformed JSON for a batch response",
  },
  {
    name: "batch segment count",
    match: (error) => /^batch mismatch:/.test(error),
    assessment: "model returned the wrong number of translated segments",
  },
  {
    name: "bold/strong count",
    match: (error) => /^AST mismatch: strong /.test(error),
    assessment: "model changed the number of Markdown bold spans",
  },
  {
    name: "heading depth",
    match: (error) => /^Heading depth sequence changed:/.test(error),
    assessment: "model changed or dropped Markdown heading markers",
  },
  {
    name: "link count",
    match: (error) => /^AST mismatch: link /.test(error),
    assessment: "model changed the number of Markdown links",
  },
  {
    name: "inline-code count",
    match: (error) => /^AST mismatch: inlineCode /.test(error),
    assessment: "model changed the number of inline-code spans",
  },
  {
    name: "list structure",
    match: (error) => /^AST mismatch: (?:list|listItem|listMarkerIndent) /.test(error),
    assessment: "model changed list items or marker indentation",
  },
  {
    name: "target script",
    match: (error) => /^Output for .* expected .* script/.test(error),
    assessment: "model output did not use the target writing system",
  },
];

const CATEGORY_BY_NAME = new Map(CATEGORY_RULES.map((rule) => [rule.name, rule]));

function usage() {
  console.log(
    [
      "Usage: pnpm analyze:translation-failures -- [directory] [--json]",
      "",
      "Analyzes FAILED-TRANSLATION and DEBUG-TRANSLATION .log files.",
      "Timeout-related quality errors are excluded.",
    ].join("\n")
  );
}

function parseArgs(argv) {
  let directory = "failures.tmp";
  let json = false;
  for (const arg of argv) {
    if (arg === "--") {
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    directory = arg;
  }
  return { directory, json };
}

function headerValue(text, key) {
  const match = new RegExp(`^${key}: (.*)$`, "m").exec(text);
  return match?.[1]?.trim() ?? "";
}

function qualityErrors(text) {
  const section = QUALITY_SECTION_RE.exec(text)?.[1] ?? "";
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line !== "(none)");
}

function categoryFor(error) {
  return (
    CATEGORY_RULES.find((rule) => rule.match(error))?.name ??
    (error.startsWith("AST mismatch:") ? "other Markdown AST" : "other validation")
  );
}

function normalizeError(error) {
  return error
    .replace(/\s*\(hash [^)]+\)/g, "")
    .replace(/ at segment \d+/g, "")
    .trim();
}

function parseAst(text) {
  const stats = {};
  for (const match of text.matchAll(
    /\b(list|listItem|inlineCode|strong|emphasis|link|image|code|table)=(-?\d+)/g
  )) {
    stats[match[1]] = Number(match[2]);
  }
  const headings = /\bheadings=\[([^]]*)\]/.exec(text)?.[1] ?? "";
  stats.headings = headings
    ? headings
        .split(",")
        .filter(Boolean)
        .map((value) => Number(value))
    : [];
  const indents = /\bindents=\[([^]]*)\]/.exec(text)?.[1] ?? "";
  stats.indents = indents
    ? indents
        .split(",")
        .filter(Boolean)
        .map((value) => Number(value))
    : [];
  return stats;
}

function checkerEvidence(error, snapshots) {
  if (snapshots.length === 0) {
    return "unobserved";
  }

  const astMismatch = /^AST mismatch: (\w+) (\d+) → (\d+)/.exec(error);
  if (astMismatch) {
    const [, metric, sourceValue, restoredValue] = astMismatch;
    const expected = `${Number(sourceValue)}:${Number(restoredValue)}`;
    return snapshots.some(
      (snapshot) => `${snapshot.source[metric]}:${snapshot.restored[metric]}` === expected
    )
      ? "confirmed"
      : "contradicted";
  }

  const headingMismatch = /^Heading depth sequence changed: \[([^]]*)\] → \[([^]]*)\]/.exec(error);
  if (headingMismatch) {
    const expected = `${headingMismatch[1]}→${headingMismatch[2]}`;
    return snapshots.some(
      (snapshot) =>
        `${snapshot.source.headings.join(",")}→${snapshot.restored.headings.join(",")}` === expected
    )
      ? "confirmed"
      : "contradicted";
  }

  const indentMismatch = /^AST mismatch: listMarkerIndent \[([^]]*)\] → \[([^]]*)\]/.exec(error);
  if (indentMismatch) {
    const expected = `${indentMismatch[1]}→${indentMismatch[2]}`;
    return snapshots.some(
      (snapshot) =>
        `${snapshot.source.indents.join(",")}→${snapshot.restored.indents.join(",")}` === expected
    )
      ? "confirmed"
      : "contradicted";
  }

  return "notApplicable";
}

function parseSnapshots(text) {
  const snapshots = [];
  const snapshotSection = text.split("--- checker inputs (unprotected source vs restored) ---")[1];
  if (!snapshotSection) {
    return snapshots;
  }
  const pairs = snapshotSection
    .split(/-- pair \d+\/\d+ --/)
    .filter((pair) => pair.includes("sourceAst:"));
  for (const pair of pairs.length > 0 ? pairs : [snapshotSection]) {
    const source = /sourceAst: (.*)/.exec(pair)?.[1];
    const restored = /restoredAst: (.*)/.exec(pair)?.[1];
    if (source && restored) {
      snapshots.push({ source: parseAst(source), restored: parseAst(restored) });
    }
  }
  return snapshots;
}

function increment(map, key) {
  map[key] = (map[key] ?? 0) + 1;
}

function sortedCounts(map) {
  return Object.fromEntries(
    Object.entries(map).sort(([a, aCount], [b, bCount]) => bCount - aCount || a.localeCompare(b))
  );
}

function readLogs(directory) {
  const absoluteDirectory = path.resolve(directory);
  const files = fs
    .readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".log"))
    .map((entry) => path.join(absoluteDirectory, entry.name))
    .sort();
  const categories = new Map();
  const attempts = new Set();
  const incidents = new Set();
  const logsWithErrors = new Set();
  let timeoutErrorsExcluded = 0;
  let errorLines = 0;
  let failureLogs = 0;
  let debugLogs = 0;

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const mode = text.includes("translation failure") ? "failure" : "debug";
    if (mode === "failure") {
      failureLogs++;
    } else {
      debugLogs++;
    }
    const errors = qualityErrors(text);
    const nonTimeoutErrors = errors.filter((error) => {
      if (TIMEOUT_RE.test(error)) {
        timeoutErrorsExcluded++;
        return false;
      }
      return true;
    });
    if (nonTimeoutErrors.length === 0) {
      continue;
    }

    logsWithErrors.add(file);
    const locale = headerValue(text, "locale");
    const document = headerValue(text, "document");
    const model = headerValue(text, "failedModel");
    const segments = headerValue(text, "segments");
    const snapshots = parseSnapshots(text);

    for (const error of nonTimeoutErrors) {
      errorLines++;
      const category = categoryFor(error);
      const normalized = normalizeError(error);
      const hash = HASH_RE.exec(error)?.[1];
      const attemptKey = [locale, document, model, segments, normalized].join("\u0000");
      const incidentKey = [locale, document, hash ?? segments, category].join("\u0000");
      attempts.add(attemptKey);
      incidents.add(incidentKey);

      if (!categories.has(category)) {
        categories.set(category, {
          name: category,
          assessment: CATEGORY_BY_NAME.get(category)?.assessment ?? "requires manual inspection",
          errorLines: 0,
          files: new Set(),
          attempts: new Set(),
          incidents: new Set(),
          models: {},
          locales: {},
          documents: {},
          examples: new Set(),
          checkerEvidence: { confirmed: 0, contradicted: 0, unobserved: 0, notApplicable: 0 },
        });
      }
      const summary = categories.get(category);
      summary.errorLines++;
      summary.files.add(file);
      summary.attempts.add(attemptKey);
      summary.incidents.add(incidentKey);
      increment(summary.models, model || "(unknown)");
      increment(summary.locales, locale || "(unknown)");
      increment(summary.documents, document || "(unknown)");
      summary.examples.add(path.relative(process.cwd(), file));
      summary.checkerEvidence[checkerEvidence(error, snapshots)]++;
    }
  }

  return {
    directory: absoluteDirectory,
    totalLogs: files.length,
    failureLogs,
    debugLogs,
    logsWithErrors: logsWithErrors.size,
    errorLines,
    timeoutErrorsExcluded,
    uniqueAttemptRecords: attempts.size,
    uniqueIncidents: incidents.size,
    categories: [...categories.values()]
      .map((summary) => ({
        ...summary,
        files: summary.files.size,
        attempts: summary.attempts.size,
        incidents: summary.incidents.size,
        models: sortedCounts(summary.models),
        locales: sortedCounts(summary.locales),
        documents: sortedCounts(summary.documents),
        examples: [...summary.examples].sort().slice(0, 3),
      }))
      .sort((a, b) => b.incidents - a.incidents || b.errorLines - a.errorLines),
  };
}

function formatCounts(counts) {
  return Object.entries(counts)
    .map(([key, count]) => `${key} (${count})`)
    .join(", ");
}

function printReport(report) {
  console.log(`# Translation failure analysis`);
  console.log(`Directory: ${report.directory}`);
  console.log(
    `Logs: ${report.totalLogs} (${report.failureLogs} FAILED, ${report.debugLogs} DEBUG); ` +
      `${report.logsWithErrors} contain non-timeout validation errors`
  );
  console.log(
    `Validation errors: ${report.errorLines}; unique attempts: ${report.uniqueAttemptRecords}; ` +
      `unique incidents: ${report.uniqueIncidents}; timeout errors excluded: ${report.timeoutErrorsExcluded}`
  );
  console.log("");

  if (report.categories.length === 0) {
    console.log("No non-timeout validation errors found.");
    return;
  }

  console.log("## Prioritized causes");
  report.categories.forEach((category, index) => {
    console.log(
      `${index + 1}. **${category.name}** — ${category.incidents} distinct incidents, ` +
        `${category.attempts} model-attempt records, ${category.errorLines} logged error lines`
    );
    console.log(`   Assessment: ${category.assessment}.`);
    console.log(`   Models: ${formatCounts(category.models)}`);
    console.log(`   Locales: ${formatCounts(category.locales)}`);
    const evidence = category.checkerEvidence;
    if (evidence.confirmed || evidence.contradicted) {
      console.log(
        `   Snapshot evidence: ${evidence.confirmed} confirmed, ${evidence.contradicted} contradicted`
      );
    }
    console.log(`   Examples: ${category.examples.join(", ")}`);
  });

  const contradicted = report.categories.reduce(
    (total, category) => total + category.checkerEvidence.contradicted,
    0
  );
  console.log("");
  console.log("## Checker assessment");
  if (contradicted === 0) {
    console.log(
      "No checker contradiction was found in the captured AST snapshots. " +
        "The observed structural failures match the source/restored structures and are valid model-output failures."
    );
  } else {
    console.log(
      `${contradicted} AST error(s) disagree with their captured checker snapshot; inspect those cases before treating them as model failures.`
    );
  }
}

try {
  const args = parseArgs(process.argv.slice(2));
  const report = readLogs(args.directory);
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }
} catch (error) {
  console.error(
    `Could not analyze translation logs: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
}
