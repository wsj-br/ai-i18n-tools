import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHEAPERINFERENCE_DATA_PROTECTION_URL,
  cheaperInferenceFetch,
  explainZeroDataRetentionRefusal,
  isZeroDataRetentionRefusal,
} from "../../src/api/cheaperinference-zdr.js";

describe("isZeroDataRetentionRefusal", () => {
  it("matches the route sentence and the error code", () => {
    expect(
      isZeroDataRetentionRefusal(
        "No zero-data-retention route serves gemini-2.5-pro-preview-06-05."
      )
    ).toBe(true);
    expect(isZeroDataRetentionRefusal('{"error":{"code":"zdr_capacity_unavailable"}}')).toBe(true);
    expect(isZeroDataRetentionRefusal("upstream timeout")).toBe(false);
  });
});

describe("explainZeroDataRetentionRefusal", () => {
  it("points at the config flag when zero data retention is off", () => {
    const message = explainZeroDataRetentionRefusal("gpt-5.1", false);
    expect(message).toContain("gpt-5.1");
    expect(message).toContain("providers.cheaperinference.zeroDataRetention");
    expect(message).toContain(CHEAPERINFERENCE_DATA_PROTECTION_URL);
  });

  it("tells the user to remove the model when zero data retention is on", () => {
    const message = explainZeroDataRetentionRefusal("gemini-2.5-pro-preview-06-05", true);
    expect(message).toContain("not in the Cheaper Inference zero-data-retention catalog");
    expect(message).toContain(CHEAPERINFERENCE_DATA_PROTECTION_URL);
  });
});

describe("cheaperInferenceFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rewrites a zero-data-retention 503 to 400 so the SDK does not retry it", async () => {
    const body = JSON.stringify({
      error: {
        message: "No zero-data-retention route serves gemini-2.5-pro-preview-06-05.",
        code: "zdr_capacity_unavailable",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(body, { status: 503, statusText: "Service Unavailable" }))
    );
    const response = await cheaperInferenceFetch(
      "https://api.cheaperinference.com/v1/chat/completions",
      {
        method: "POST",
      }
    );
    expect(response.status).toBe(400);
    expect(await response.text()).toBe(body);
  });

  it("keeps a 503 that is not a zero-data-retention refusal", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response("busy", { status: 503, statusText: "Service Unavailable" }))
    );
    const response = await cheaperInferenceFetch(
      "https://api.cheaperinference.com/v1/chat/completions"
    );
    expect(response.status).toBe(503);
    expect(await response.text()).toBe("busy");
  });
});
