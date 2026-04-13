import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Logger, stripAnsi, truncateLogFile } from "../../src/utils/logger.js";

describe("Logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("buffers session lines", () => {
    const log = new Logger({ level: "info", noColor: true });
    log.info("hello");
    expect(log.getSessionLog().some((l) => l.includes("hello"))).toBe(true);
    log.close();
  });

  it("writes to file when filePath set", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-log-"));
    const p = path.join(dir, "app.log");
    const log = new Logger({ level: "debug", filePath: p, noColor: true });
    log.warn("on disk");
    await new Promise<void>((resolve, reject) => {
      log.close((err) => (err ? reject(err) : resolve()));
    });
    const text = fs.readFileSync(p, "utf8");
    expect(text).toContain("on disk");
  });

  it("child logger inherits context prefix", () => {
    const log = new Logger({ level: "info", noColor: true, context: "root" });
    const child = log.child("sub");
    child.info("nested");
    expect(child.getSessionLog().some((l) => l.includes("[root:sub]"))).toBe(true);
    log.close();
  });

  it("logApiTraffic emits at debug level", () => {
    const log = new Logger({ level: "debug", noColor: true });
    log.logApiTraffic("request", "POST /v1", { model: "m" });
    expect(log.getSessionLog().some((l) => l.includes("API request"))).toBe(true);
    log.close();
  });

  it("logApiTraffic is silent when level is info", () => {
    const log = new Logger({ level: "info", noColor: true });
    log.logApiTraffic("request", "x");
    expect(log.getSessionLog().some((l) => l.includes("API request"))).toBe(false);
    log.close();
  });

  it("error uses console.error path", () => {
    const log = new Logger({ level: "info", noColor: true });
    log.error("fail");
    expect(log.getSessionLog().some((l) => l.includes("ERROR") && l.includes("fail"))).toBe(true);
    log.close();
  });

  it("close without file invokes callback", async () => {
    const log = new Logger({ level: "info", noColor: true });
    await new Promise<void>((resolve, reject) => {
      log.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("warn level hides info and debug", () => {
    const log = new Logger({ level: "warn", noColor: true });
    log.debug("d");
    log.info("i");
    expect(log.getSessionLog()).toHaveLength(0);
    log.warn("w");
    expect(log.getSessionLog().some((l) => l.includes("WARN") && l.includes("w"))).toBe(true);
    log.close();
  });

  it("info serializes extra metadata", () => {
    const log = new Logger({ level: "info", noColor: true });
    log.info("x", { n: 42 });
    expect(log.getSessionLog().some((l) => l.includes('"n":42'))).toBe(true);
    log.close();
  });

  it("session log trims when exceeding max lines", () => {
    const prev = new Map<string, string | undefined>();
    for (const k of ["I18N_LOG_SESSION_MAX", "I18N_LOG_LEVEL", "NO_COLOR"]) {
      prev.set(k, process.env[k]);
    }
    process.env.I18N_LOG_SESSION_MAX = "3";
    delete process.env.I18N_LOG_LEVEL;
    delete process.env.NO_COLOR;
    const log = new Logger({ level: "info", noColor: true });
    log.info("a");
    log.info("b");
    log.info("c");
    log.info("d");
    expect(log.getSessionLog().length).toBeLessThanOrEqual(3);
    log.close();
    for (const [k, v] of prev) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  });

  it("parseLevel falls back to info for invalid I18N_LOG_LEVEL", () => {
    const prev = process.env.I18N_LOG_LEVEL;
    process.env.I18N_LOG_LEVEL = "not-a-level";
    const log = new Logger({ noColor: true });
    log.debug("hidden");
    expect(log.getSessionLog().length).toBe(0);
    log.close();
    if (prev === undefined) {
      delete process.env.I18N_LOG_LEVEL;
    } else {
      process.env.I18N_LOG_LEVEL = prev;
    }
  });

  it("uses colored console when TTY and no NO_COLOR", () => {
    const prev = new Map<string, string | undefined>();
    for (const k of ["NO_COLOR", "I18N_LOG_LEVEL"]) {
      prev.set(k, process.env[k]);
    }
    delete process.env.NO_COLOR;
    delete process.env.I18N_LOG_LEVEL;
    const stdout = process.stdout as NodeJS.WriteStream & { isTTY?: boolean };
    const prevTty = stdout.isTTY;
    stdout.isTTY = true;
    const log = new Logger({ level: "debug", noColor: false });
    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");
    expect(console.log).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
    expect(log.getSessionLog().length).toBe(4);
    log.close();
    stdout.isTTY = prevTty;
    for (const [k, v] of prev) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  });

  it("invalid I18N_LOG_SESSION_MAX falls back to default cap", () => {
    const prev = process.env.I18N_LOG_SESSION_MAX;
    process.env.I18N_LOG_SESSION_MAX = "not-a-number";
    const log = new Logger({ level: "info", noColor: true });
    log.info("x");
    expect(log.getSessionLog().length).toBe(1);
    log.close();
    if (prev === undefined) {
      delete process.env.I18N_LOG_SESSION_MAX;
    } else {
      process.env.I18N_LOG_SESSION_MAX = prev;
    }
  });
});

describe("stripAnsi and truncateLogFile", () => {
  it("stripAnsi removes ANSI codes", () => {
    expect(stripAnsi("\u001b[31mred\u001b[0m")).toBe("red");
  });

  it("truncateLogFile keeps tail when file is large", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-trunc-"));
    const p = path.join(dir, "big.log");
    const body = `${"x".repeat(2000)}\nTAIL\n`;
    fs.writeFileSync(p, body, "utf8");
    await truncateLogFile(p, 100);
    const out = fs.readFileSync(p, "utf8");
    expect(out.length).toBeLessThanOrEqual(100);
    expect(out).toContain("TAIL");
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("truncateLogFile no-ops when file missing", async () => {
    await truncateLogFile(path.join(os.tmpdir(), `missing-${Date.now()}.log`), 10);
  });

  it("truncateLogFile no-ops when file small", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-trunc2-"));
    const p = path.join(dir, "small.log");
    fs.writeFileSync(p, "hi", "utf8");
    await truncateLogFile(p, 1000);
    expect(fs.readFileSync(p, "utf8")).toBe("hi");
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
