import fs from "fs";
import path from "path";
import chalk from "chalk";

export type LogLevelName = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevelName, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function parseLevel(raw: string | undefined): LogLevelName {
  const n = (raw ?? "info").toLowerCase();
  if (n === "debug" || n === "info" || n === "warn" || n === "error") {
    return n;
  }
  return "info";
}

function timestamp(): string {
  return new Date().toISOString();
}

export interface LoggerOptions {
  /** Minimum level to emit (console and file). */
  level?: LogLevelName;
  /** When set, append structured lines to this file (no rotation in Phase 1 — use logrotate externally). */
  filePath?: string;
  /** Label prefix for this logger instance. */
  context?: string;
  /** When true, skip ANSI colors (e.g. CI or file-only). */
  noColor?: boolean;
}

/**
 * Structured logger: leveled console output with optional file tee and a simple session buffer.
 */
export class Logger {
  private readonly level: LogLevelName;
  private readonly context?: string;
  private readonly noColor: boolean;
  private fileStream: fs.WriteStream | null = null;
  private readonly sessionLines: string[] = [];
  private readonly maxSessionLines: number;

  constructor(private readonly options: LoggerOptions = {}) {
    this.level = options.level ?? parseLevel(process.env.I18N_LOG_LEVEL);
    this.context = options.context;
    this.noColor = options.noColor ?? (process.env.NO_COLOR === "1" || !process.stdout.isTTY);
    this.maxSessionLines = Number(process.env.I18N_LOG_SESSION_MAX ?? "5000");
    if (!Number.isFinite(this.maxSessionLines) || this.maxSessionLines < 1) {
      this.maxSessionLines = 5000;
    }
    if (options.filePath) {
      fs.mkdirSync(path.dirname(path.resolve(options.filePath)), { recursive: true });
      this.fileStream = fs.createWriteStream(options.filePath, { flags: "a" });
    }
  }

  child(ctx: string): Logger {
    const nextCtx = this.context ? `${this.context}:${ctx}` : ctx;
    return new Logger({
      ...this.options,
      context: nextCtx,
      filePath: undefined,
    });
  }

  /** Last N formatted log lines for this process (debug / support). */
  getSessionLog(): readonly string[] {
    return [...this.sessionLines];
  }

  private shouldEmit(level: LogLevelName): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.level];
  }

  private formatLine(
    level: LogLevelName,
    message: string,
    extra?: Record<string, unknown>
  ): string {
    const ctx = this.context ? `[${this.context}] ` : "";
    const base = `${timestamp()} ${level.toUpperCase()} ${ctx}${message}`;
    if (extra && Object.keys(extra).length > 0) {
      return `${base} ${JSON.stringify(extra)}`;
    }
    return base;
  }

  private pushSession(line: string): void {
    this.sessionLines.push(line);
    if (this.sessionLines.length > this.maxSessionLines) {
      this.sessionLines.splice(0, this.sessionLines.length - this.maxSessionLines);
    }
  }

  private write(level: LogLevelName, message: string, extra?: Record<string, unknown>): void {
    if (!this.shouldEmit(level)) {
      return;
    }
    const plain = this.formatLine(level, message, extra);
    this.pushSession(plain);

    let consoleLine = plain;
    if (!this.noColor) {
      const color =
        level === "error"
          ? chalk.red
          : level === "warn"
            ? chalk.yellow
            : level === "debug"
              ? chalk.gray
              : chalk.white;
      consoleLine = color(plain);
    }
    if (level === "error") {
      console.error(consoleLine);
    } else if (level === "warn") {
      console.warn(consoleLine);
    } else {
      console.log(consoleLine);
    }

    if (this.fileStream) {
      this.fileStream.write(`${plain}\n`);
    }
  }

  debug(message: string, extra?: Record<string, unknown>): void {
    this.write("debug", message, extra);
  }

  info(message: string, extra?: Record<string, unknown>): void {
    this.write("info", message, extra);
  }

  warn(message: string, extra?: Record<string, unknown>): void {
    this.write("warn", message, extra);
  }

  error(message: string, extra?: Record<string, unknown>): void {
    this.write("error", message, extra);
  }

  /** OpenRouter / HTTP traffic (respects log level; always plain JSON-ish). */
  logApiTraffic(
    direction: "request" | "response",
    summary: string,
    detail?: Record<string, unknown>
  ): void {
    if (!this.shouldEmit("debug")) {
      return;
    }
    const msg = `API ${direction}: ${summary}`;
    this.write("debug", msg, detail);
  }

  close(done?: (err?: Error) => void): void {
    if (this.fileStream) {
      const s = this.fileStream;
      this.fileStream = null;
      s.end(() => done?.());
    } else {
      done?.();
    }
  }
}

/**
 * Truncate a log file by keeping the last `keepBytes` bytes (best-effort rotation helper).
 */
export async function truncateLogFile(filePath: string, keepBytes: number): Promise<void> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    return;
  }
  const stat = fs.statSync(resolved);
  if (stat.size <= keepBytes) {
    return;
  }
  const stream = fs.createReadStream(resolved, {
    start: stat.size - keepBytes,
    end: stat.size - 1,
  });
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const tail = Buffer.concat(chunks);
  await fs.promises.writeFile(resolved, tail);
}

/** Strip ANSI codes from a string (for exporting session logs). */
export function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\u001b\[[0-9;]*m/g, "");
}
