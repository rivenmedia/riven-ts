import { describe, expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

describe("settingsService", () => {
  it("stores and returns upserted values", async ({ services }) => {
    await services.settingsService.writeValues("ns-a", {
      upsert: { a: 1 },
      delete: [],
    });

    await expect(
      services.settingsService.getStoredValues("ns-a"),
    ).resolves.toStrictEqual({
      a: 1,
    });
  });

  it("keeps an explicit null", async ({ services }) => {
    await services.settingsService.writeValues("ns-b", {
      upsert: { a: null },
      delete: [],
    });

    await expect(
      services.settingsService.getStoredValues("ns-b"),
    ).resolves.toStrictEqual({
      a: null,
    });
  });

  it("updates existing values", async ({ services }) => {
    await services.settingsService.writeValues("ns-c", {
      upsert: { a: 1 },
      delete: [],
    });
    await services.settingsService.writeValues("ns-c", {
      upsert: { a: 2 },
      delete: [],
    });

    await expect(
      services.settingsService.getStoredValues("ns-c"),
    ).resolves.toStrictEqual({
      a: 2,
    });
  });

  it("deletes keys", async ({ services }) => {
    await services.settingsService.writeValues("ns-d", {
      upsert: { a: 1, b: 2 },
      delete: [],
    });
    await services.settingsService.writeValues("ns-d", {
      upsert: {},
      delete: ["a"],
    });

    await expect(
      services.settingsService.getStoredValues("ns-d"),
    ).resolves.toStrictEqual({
      b: 2,
    });
  });

  it("rolls back the whole write when part of it fails", async ({
    services,
  }) => {
    await services.settingsService.writeValues("ns-e", {
      upsert: { a: 1 },
      delete: [],
    });

    await expect(
      services.settingsService.writeValues("ns-e", {
        upsert: { a: 2, b: 3 },
        // Non-string key forces a failure after the upsert has been issued
        delete: [{ bad: true } as unknown as string],
      }),
    ).rejects.toThrow(/.+/u);

    await expect(
      services.settingsService.getStoredValues("ns-e"),
    ).resolves.toStrictEqual({
      a: 1,
    });
  });

  it("isolates namespaces", async ({ services }) => {
    await services.settingsService.writeValues("ns-f", {
      upsert: { a: 1 },
      delete: [],
    });
    await services.settingsService.writeValues("ns-g", {
      upsert: { a: 2 },
      delete: [],
    });

    await expect(
      services.settingsService.getStoredValues("ns-f"),
    ).resolves.toStrictEqual({
      a: 1,
    });

    const grouped = await services.settingsService.getStoredValuesByNamespace([
      "ns-f",
      "ns-g",
      "ns-empty",
    ]);

    expect(grouped.get("ns-g")).toStrictEqual({ a: 2 });
    expect(grouped.get("ns-empty") ?? {}).toStrictEqual({});
  });
});
