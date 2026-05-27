import { describe, expect, it } from "vitest";

import { AltmountSettings } from "../altmount-settings.schema.ts";

describe("AltmountSettings", () => {
  it("accepts a valid minimal configuration", () => {
    const result = AltmountSettings.safeParse({
      altmountUrl: "http://10.0.0.66:8081",
      altmountApiKey: "test-key",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pollIntervalMs).toBe(10_000);
      expect(result.data.pollTimeoutMs).toBe(30 * 60 * 1000);
    }
  });

  it("accepts a fully specified configuration", () => {
    const result = AltmountSettings.safeParse({
      altmountUrl: "https://altmount.example.com",
      altmountApiKey: "k",
      pollIntervalMs: 5000,
      pollTimeoutMs: 60_000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-URL altmountUrl", () => {
    const result = AltmountSettings.safeParse({
      altmountUrl: "not-a-url",
      altmountApiKey: "k",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty altmountApiKey", () => {
    const result = AltmountSettings.safeParse({
      altmountUrl: "http://altmount:8081",
      altmountApiKey: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero pollIntervalMs (must be positive)", () => {
    const result = AltmountSettings.safeParse({
      altmountUrl: "http://altmount:8081",
      altmountApiKey: "k",
      pollIntervalMs: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative pollTimeoutMs", () => {
    const result = AltmountSettings.safeParse({
      altmountUrl: "http://altmount:8081",
      altmountApiKey: "k",
      pollTimeoutMs: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects float pollIntervalMs", () => {
    const result = AltmountSettings.safeParse({
      altmountUrl: "http://altmount:8081",
      altmountApiKey: "k",
      pollIntervalMs: 100.5,
    });
    expect(result.success).toBe(false);
  });
});
