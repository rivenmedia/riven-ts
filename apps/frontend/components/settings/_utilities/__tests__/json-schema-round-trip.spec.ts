import { describe, expect, it } from "vitest";
import { z } from "zod";

import { buildSettingsConfigFromZodSchema } from "../build-settings-config-from-zod-schema.ts";

describe("json schema round-trip", () => {
  it("preserves what the settings config builder needs", () => {
    const schema = z.object({
      name: z.string().meta({ title: "Name", description: "d" }),
      apiKey: z.string().meta({ secret: true }),
      port: z.int().default(3000),
      level: z.enum(["info", "debug"]),
      cooldown: z.tuple([z.int(), z.int(), z.int()]),
      // Served as `anyOf [T, { type: "null" }]`, which comes back as a union
      updateIntervalSeconds: z
        .int()
        .nonnegative()
        .nullable()
        .default(60)
        .meta({ title: "Update Interval" }),
      watchlistEnabled: z.boolean().nullable().meta({ title: "Watchlist" }),
    });

    const rebuilt = z.fromJSONSchema(z.toJSONSchema(schema, { io: "input" }));

    expect(buildSettingsConfigFromZodSchema(rebuilt)).toStrictEqual(
      buildSettingsConfigFromZodSchema(schema),
    );
  });
});
