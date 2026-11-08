import { expect, it } from "vitest";

import { RivenSettings } from "./riven-settings.schema.ts";

const requiredSettings = {
  databaseUrl: "postgresql://riven@localhost/riven",
  redisUrl: "redis://localhost:6379",
  vfsMountPath: "/mnt/riven",
};

it("apiKey setting rejects a key shorter than 32 characters", () => {
  const { error } = RivenSettings.safeParse({
    ...requiredSettings,
    apiKey: "k".repeat(31),
  });

  expect(error?.issues).toStrictEqual([
    expect.objectContaining({ code: "too_small", path: ["apiKey"] }),
  ]);
});

it("apiKey setting accepts a key of 32 characters", () => {
  expect(
    RivenSettings.parse({ ...requiredSettings, apiKey: "k".repeat(32) }),
  ).toHaveProperty("apiKey", "k".repeat(32));
});
