import fs from "fs";
import os from "os";
import path from "path";
import { Logger } from "../../src/utils/logger";

describe("Logger", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
});
