import { describe, expect, it, vi } from "vitest";
import {
  RunInterruptedError,
  createRunInterruptScope,
  exitIfRunInterrupted,
  interruptErrorFromSignal,
  isRunInterruptedError,
} from "../../src/utils/run-interrupt.js";
import { runMapWithConcurrency } from "../../src/utils/concurrency.js";

describe("run-interrupt", () => {
  it("isRunInterruptedError identifies RunInterruptedError", () => {
    expect(isRunInterruptedError(new RunInterruptedError())).toBe(true);
    expect(isRunInterruptedError(new Error("Interrupted"))).toBe(false);
  });

  it("createRunInterruptScope aborts signal on SIGINT", () => {
    const scope = createRunInterruptScope("");
    const listeners = process.listeners("SIGINT") as Array<() => void>;
    listeners[listeners.length - 1]!();
    expect(scope.signal.aborted).toBe(true);
    expect(isRunInterruptedError(scope.signal.reason)).toBe(true);
    scope.dispose();
  });

  it("interruptErrorFromSignal preserves RunInterruptedError reason", () => {
    const ac = new AbortController();
    const err = new RunInterruptedError(143);
    ac.abort(err);
    expect(interruptErrorFromSignal(ac.signal)).toBe(err);
  });

  it("exitIfRunInterrupted exits with code 130", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    expect(exitIfRunInterrupted(new RunInterruptedError())).toBe(true);
    expect(exit).toHaveBeenCalledWith(130);
    exit.mockRestore();
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
