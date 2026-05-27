import { expect, it } from "vitest";

import { RivenSettings } from "./riven-settings.schema.ts";

const minimalSettings = {
  databaseUrl: "postgresql://localhost:5432/riven",
  redisUrl: "redis://localhost:6379",
  vfsMountPath: "/mnt/riven",
};

it("downloadStrategy defaults to 'torrent' when not specified", () => {
  const result = RivenSettings.parse(minimalSettings);
  expect(result.downloadStrategy).toBe("torrent");
});

it("downloadStrategy accepts 'torrent' explicitly", () => {
  const result = RivenSettings.parse({
    ...minimalSettings,
    downloadStrategy: "torrent",
  });
  expect(result.downloadStrategy).toBe("torrent");
});

it("downloadStrategy accepts 'nzb'", () => {
  const result = RivenSettings.parse({
    ...minimalSettings,
    downloadStrategy: "nzb",
  });
  expect(result.downloadStrategy).toBe("nzb");
});

it("downloadStrategy rejects an invalid value", () => {
  expect(() =>
    RivenSettings.parse({
      ...minimalSettings,
      downloadStrategy: "p2p",
    }),
  ).toThrow();
});
