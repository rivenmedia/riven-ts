import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { rankingPresets } from "#ranking/presets/index.ts";

it("lists built-ins first, then by name, alphabetically", async ({
  factories: { rankingProfileFactory },
  services: { rankingProfileService },
}) => {
  for (const letter of ["A", "Z"] as const) {
    await rankingProfileFactory.createOne({
      name: `${letter} Custom`,
    });
  }

  await rankingProfileService.syncPresets([
    ...rankingPresets,
    {
      name: "A Built-in",
      slug: "a-built-in",
      config: {},
      description: "",
    },
    {
      name: "Z Built-in",
      slug: "z-built-in",
      config: {},
      description: "",
    },
  ]);

  const profiles = await rankingProfileService.list();

  expect(profiles.map((profile) => profile.name)).toStrictEqual([
    "A Built-in",
    "Default",
    "Z Built-in",
    "A Custom",
    "Z Custom",
  ]);
});
