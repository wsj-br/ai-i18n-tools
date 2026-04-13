import {
  runMapWithConcurrency,
  AsyncSemaphore,
  AsyncMutex,
} from "../../src/utils/concurrency.js";

describe("runMapWithConcurrency", () => {
  it("returns empty array for empty items", async () => {
    const out = await runMapWithConcurrency([], 4, async () => 1);
    expect(out).toEqual([]);
  });

  it("returns results in input order", async () => {
    const items = [1, 2, 3, 4, 5];
    const out = await runMapWithConcurrency(items, 2, async (n, i) => {
      await new Promise((r) => setTimeout(r, 5 - n));
      return n * 10 + i;
    });
    expect(out).toEqual([10, 21, 32, 43, 54]);
  });

  it("respects concurrency limit", async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 20 }, (_, i) => i);
    await runMapWithConcurrency(items, 3, async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 2));
      active--;
      return 0;
    });
    expect(maxActive).toBeLessThanOrEqual(3);
  });
});

describe("AsyncSemaphore", () => {
  it("throws when max is not a positive finite number", () => {
    expect(() => new AsyncSemaphore(0)).toThrow(/max must be a finite number/);
    expect(() => new AsyncSemaphore(Number.NaN)).toThrow(/max must be a finite number/);
  });

  it("limits parallel use()", async () => {
    const sem = new AsyncSemaphore(2);
    let active = 0;
    let max = 0;
    await Promise.all(
      Array.from({ length: 20 }, () =>
        sem.use(async () => {
          active++;
          max = Math.max(max, active);
          await new Promise((r) => setTimeout(r, 1));
          active--;
          return 1;
        })
      )
    );
    expect(max).toBeLessThanOrEqual(2);
  });
});

describe("AsyncMutex", () => {
  it("serializes runExclusive", async () => {
    const m = new AsyncMutex();
    const order: number[] = [];
    await Promise.all([
      m.runExclusive(async () => {
        order.push(1);
        await new Promise((r) => setTimeout(r, 5));
        order.push(2);
      }),
      m.runExclusive(async () => {
        order.push(3);
        order.push(4);
      }),
    ]);
    expect(order).toEqual([1, 2, 3, 4]);
  });
});
