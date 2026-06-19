import { describe, expect, it, vi } from "vitest";
import {
  RunInterruptedError,
  bindRunInterruptScope,
  createRunInterruptScope,
  exitIfRunInterrupted,
  interruptErrorFromSignal,
  isRunInterruptedError,
  runInterruptedExitCode,
  throwIfAbortSignal,
} from "../../src/utils/run-interrupt.js";
import { runMapWithConcurrency } from "../../src/utils/concurrency.js";

describe("run-interrupt", () => {
  it("isRunInterruptedError identifies RunInterruptedError", () => {
    expect(isRunInterruptedError(new RunInterruptedError())).toBe(true);
    expect(isRunInterruptedError(new Error("Interrupted"))).toBe(false);
    expect(isRunInterruptedError(null)).toBe(false);
    expect(isRunInterruptedError(undefined)).toBe(false);
    expect(isRunInterruptedError("Interrupted")).toBe(false);
  });

  it("RunInterruptedError defaults to exit code 130 and keeps custom codes", () => {
    expect(new RunInterruptedError().exitCode).toBe(130);
    expect(new RunInterruptedError().name).toBe("RunInterruptedError");
    expect(new RunInterruptedError().message).toBe("Interrupted");
    expect(new RunInterruptedError(143).exitCode).toBe(143);
  });

  it("createRunInterruptScope aborts signal on SIGINT", () => {
    const scope = createRunInterruptScope("");
    const listeners = process.listeners("SIGINT") as Array<() => void>;
    listeners[listeners.length - 1]!();
    expect(scope.signal.aborted).toBe(true);
    expect(isRunInterruptedError(scope.signal.reason)).toBe(true);
    scope.dispose();
  });

  it("createRunInterruptScope writes the warning message to stderr on first signal", () => {
    const write = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const scope = createRunInterruptScope("CUSTOM-INTERRUPT-MESSAGE");
    const listeners = process.listeners("SIGINT") as Array<() => void>;
    listeners[listeners.length - 1]!();
    expect(write).toHaveBeenCalledWith("CUSTOM-INTERRUPT-MESSAGE");
    scope.dispose();
    write.mockRestore();
  });

  it("createRunInterruptScope aborts with exit code 143 on SIGTERM", () => {
    const scope = createRunInterruptScope("");
    const listeners = process.listeners("SIGTERM") as Array<() => void>;
    listeners[listeners.length - 1]!();
    expect(scope.signal.aborted).toBe(true);
    expect(runInterruptedExitCode(scope.signal.reason)).toBe(143);
    scope.dispose();
  });

  it("createRunInterruptScope force-exits on a second signal", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const write = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const scope = createRunInterruptScope("");
    const before = process.listeners("SIGINT") as Array<() => void>;
    const handler = before[before.length - 1]!;
    handler();
    expect(exit).not.toHaveBeenCalled();
    handler();
    expect(exit).toHaveBeenCalledWith(130);
    scope.dispose();
    exit.mockRestore();
    write.mockRestore();
  });

  it("createRunInterruptScope dispose removes its signal listeners and is idempotent", () => {
    const before = process.listeners("SIGINT").length;
    const scope = createRunInterruptScope("");
    expect(process.listeners("SIGINT").length).toBe(before + 1);
    scope.dispose();
    expect(process.listeners("SIGINT").length).toBe(before);
    expect(() => scope.dispose()).not.toThrow();
  });

  it("scope.throwIfAborted throws only after the signal aborts", () => {
    const scope = createRunInterruptScope("");
    expect(() => scope.throwIfAborted()).not.toThrow();
    const listeners = process.listeners("SIGINT") as Array<() => void>;
    listeners[listeners.length - 1]!();
    expect(() => scope.throwIfAborted()).toThrow(RunInterruptedError);
    scope.dispose();
  });

  it("interruptErrorFromSignal preserves RunInterruptedError reason", () => {
    const ac = new AbortController();
    const err = new RunInterruptedError(143);
    ac.abort(err);
    expect(interruptErrorFromSignal(ac.signal)).toBe(err);
  });

  it("interruptErrorFromSignal returns a fresh error for non-interrupt reasons", () => {
    const ac = new AbortController();
    ac.abort(new Error("other reason"));
    const err = interruptErrorFromSignal(ac.signal);
    expect(err).toBeInstanceOf(RunInterruptedError);
    expect(err.exitCode).toBe(130);
  });

  it("throwIfAbortSignal throws when aborted and is a no-op otherwise", () => {
    expect(() => throwIfAbortSignal(undefined)).not.toThrow();
    const fresh = new AbortController();
    expect(() => throwIfAbortSignal(fresh.signal)).not.toThrow();
    const aborted = new AbortController();
    const err = new RunInterruptedError(143);
    aborted.abort(err);
    expect(() => throwIfAbortSignal(aborted.signal)).toThrow(err);
  });

  it("exitIfRunInterrupted exits with code 130", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    expect(exitIfRunInterrupted(new RunInterruptedError())).toBe(true);
    expect(exit).toHaveBeenCalledWith(130);
    exit.mockRestore();
  });

  it("exitIfRunInterrupted uses the error's own exit code", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    expect(exitIfRunInterrupted(new RunInterruptedError(143))).toBe(true);
    expect(exit).toHaveBeenCalledWith(143);
    exit.mockRestore();
  });

  it("exitIfRunInterrupted ignores non-interrupt errors", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    expect(exitIfRunInterrupted(new Error("boom"))).toBe(false);
    expect(exit).not.toHaveBeenCalled();
    exit.mockRestore();
  });

  it("runInterruptedExitCode resolves from error, aborted signal, then default", () => {
    expect(runInterruptedExitCode(new RunInterruptedError(143))).toBe(143);
    const ac = new AbortController();
    ac.abort(new RunInterruptedError(143));
    expect(runInterruptedExitCode(new Error("boom"), ac.signal)).toBe(143);
    const open = new AbortController();
    expect(runInterruptedExitCode(new Error("boom"), open.signal)).toBe(130);
    expect(runInterruptedExitCode(new Error("boom"))).toBe(130);
  });
});

describe("bindRunInterruptScope", () => {
  it("passes through a caller-supplied signal without installing handlers", () => {
    const before = process.listeners("SIGINT").length;
    const ac = new AbortController();
    const { opts, scope } = bindRunInterruptScope({ abortSignal: ac.signal });
    expect(opts.abortSignal).toBe(ac.signal);
    expect(scope.signal).toBe(ac.signal);
    expect(process.listeners("SIGINT").length).toBe(before);
    expect(() => scope.throwIfAborted()).not.toThrow();
    ac.abort(new RunInterruptedError(143));
    expect(() => scope.throwIfAborted()).toThrow(RunInterruptedError);
    expect(() => scope.dispose()).not.toThrow();
    expect(process.listeners("SIGINT").length).toBe(before);
  });

  it("installs a managed scope when no signal is supplied", () => {
    const before = process.listeners("SIGINT").length;
    const { opts, scope } = bindRunInterruptScope<{ abortSignal?: AbortSignal; value: number }>({
      value: 7,
    });
    expect(opts.value).toBe(7);
    expect(opts.abortSignal).toBe(scope.signal);
    expect(process.listeners("SIGINT").length).toBe(before + 1);
    scope.dispose();
    expect(process.listeners("SIGINT").length).toBe(before);
  });
});

describe("runMapWithConcurrency abort", () => {
  it("throws RunInterruptedError when signal aborts before all items run", async () => {
    const ac = new AbortController();
    const started = vi.fn();
    const work = runMapWithConcurrency(
      [1, 2, 3, 4, 5],
      1,
      async (n) => {
        started(n);
        if (n === 2) {
          ac.abort(new RunInterruptedError());
        }
        await new Promise((r) => setTimeout(r, 5));
        return n;
      },
      ac.signal
    );
    await expect(work).rejects.toBeInstanceOf(RunInterruptedError);
    expect(started).toHaveBeenCalledWith(1);
    expect(started).toHaveBeenCalledWith(2);
  });

  it("rejects promptly when signal aborts during in-flight work", async () => {
    const ac = new AbortController();
    let slowStarted = false;
    const work = runMapWithConcurrency(
      [1, 2, 3],
      2,
      async (n) => {
        if (n === 1) {
          slowStarted = true;
          await new Promise((r) => setTimeout(r, 200));
        }
        return n;
      },
      ac.signal
    );
    await new Promise((r) => setTimeout(r, 20));
    ac.abort(new RunInterruptedError());
    const start = Date.now();
    await expect(work).rejects.toBeInstanceOf(RunInterruptedError);
    expect(Date.now() - start).toBeLessThan(150);
    expect(slowStarted).toBe(true);
  });
});
