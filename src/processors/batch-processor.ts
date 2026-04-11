import type { Segment } from "../core/types.js";

export interface BatchConfig {
  batchSize: number;
  maxBatchChars: number;
}

const DEFAULT_BATCH: BatchConfig = {
  batchSize: 20,
  maxBatchChars: 4096,
};

/**
 * Group translatable segments into batches: bounded by max count and max total chars.
 */
export function splitTranslatableIntoBatches(
  segments: Segment[],
  config: Partial<BatchConfig> = {}
): Segment[][] {
  const batchSize = config.batchSize ?? DEFAULT_BATCH.batchSize;
  const maxBatchChars = config.maxBatchChars ?? DEFAULT_BATCH.maxBatchChars;

  const translatable = segments.filter((s) => s.translatable);
  const batches: Segment[][] = [];
  let current: Segment[] = [];
  let chars = 0;

  const flush = () => {
    if (current.length > 0) {
      batches.push(current);
      current = [];
      chars = 0;
    }
  };

  for (const s of translatable) {
    const addLen = s.content.length;
    if (current.length >= batchSize || (current.length > 0 && chars + addLen > maxBatchChars)) {
      flush();
    }
    current.push(s);
    chars += addLen;
  }
  flush();

  return batches;
}
