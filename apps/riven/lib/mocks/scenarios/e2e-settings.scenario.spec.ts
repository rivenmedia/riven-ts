import { journeyFixtures } from "@repo/util-e2e";

import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { RankingProfile } from "#database/entities/ranking-profile.entity.ts";

import { e2eSettingsScenario } from "./e2e-settings.scenario.ts";

const { customProfile } = journeyFixtures.settings;

it("seeds the custom ranking profile", async ({ em, orm }) => {
  await e2eSettingsScenario.seed(em);

  const profile = await orm.em.fork().findOneOrFail(RankingProfile, {
    name: customProfile.name,
  });

  expect(profile.description).toBe(customProfile.description);
  expect(profile.builtIn).toBe(false);
});
