/**
 * Bounded concurrency helpers for translation and batch workloads.
 */

/**
 * Run async `fn(item, index)` for each item with at most `limit` concurrent executions.
 * Results are in the same order as `items`.
 */
export async function runMapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const cap = Math.max(1, Math.min(Math.floor(limit), items.length));
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!, i);
    }
  }
  await Promise.all(Array.from({ length: cap }, () => worker()));
  return results;
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
