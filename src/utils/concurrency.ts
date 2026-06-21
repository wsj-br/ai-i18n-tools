/**
 * Bounded concurrency helpers for translation and batch workloads.
 */

import { RunInterruptedError, interruptErrorFromSignal } from "./run-interrupt.js";

function abortError(signal: AbortSignal): RunInterruptedError {
  return signal.reason instanceof RunInterruptedError
    ? signal.reason
    : interruptErrorFromSignal(signal);
}

/**
 * Yield to the macrotask queue (one `setImmediate` turn).
 *
 * Fully-cached runs do no real async I/O (synchronous `fs.*` + synchronous `better-sqlite3`),
 * so the pipeline executes as one unbroken microtask cascade. Node only dispatches signal
 * handlers (e.g. SIGINT) at event-loop boundaries, so without an occasional macrotask yield the
 * libuv loop is starved and Ctrl+C cannot interrupt the run until it finishes. Awaiting this in
 * hot loops gives the event loop a chance to deliver the signal so the abort becomes observable.
 */
export function yieldToEventLoop(): Promise<void> {
  return new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

/**
 * Run async `fn(item, index)` for each item with at most `limit` concurrent executions.
 * Results are in the same order as `items`.
 * When `signal` aborts, rejects promptly (does not wait for in-flight `fn` calls to finish).
 */
export async function runMapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }
  if (signal?.aborted) {
    throw abortError(signal);
  }

  const cap = Math.max(1, Math.min(Math.floor(limit), items.length));
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        const onAbort = (): void => reject(abortError(signal));
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
      })
    : null;

  async function worker(): Promise<void> {
    for (;;) {
      if (signal?.aborted) {
        throw abortError(signal);
      }
      const i = nextIndex++;
      if (i >= items.length) {
        return;
      }
      results[i] = await fn(items[i]!, i);
      // Yield to the macrotask queue so the event loop can deliver signals (e.g. SIGINT) even
      // when `fn` resolved synchronously (fully-cached runs); otherwise the abort never fires.
      await yieldToEventLoop();
      if (signal?.aborted) {
        throw abortError(signal);
      }
    }
  }

  const workPromise = Promise.all(Array.from({ length: cap }, () => worker())).then(() => {
    if (signal?.aborted) {
      throw abortError(signal);
    }
    return results;
  });

  if (abortPromise) {
    return Promise.race([workPromise, abortPromise]);
  }
  return workPromise;
}

/**
 * Limit how many async tasks run at once (e.g. parallel OpenRouter calls per file).
 */
export class AsyncSemaphore {
  private active = 0;
  private readonly wait: Array<() => void> = [];

  constructor(private readonly max: number) {
    if (!Number.isFinite(max) || max < 1) {
      throw new Error("AsyncSemaphore: max must be a finite number >= 1");
    }
  }

  async use<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active++;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.wait.push(() => {
        this.active++;
        resolve();
      });
    });
  }

  private release(): void {
    this.active--;
    const next = this.wait.shift();
    if (next) next();
  }
}

/**
 * Serialize async critical sections (e.g. SQLite cache access from parallel locale workers).
 */
export class AsyncMutex {
  private locked = false;
  private readonly wait: Array<() => void> = [];

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.wait.push(() => {
        resolve();
      });
    });
  }

  private release(): void {
    const next = this.wait.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }
}
