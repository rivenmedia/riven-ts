import { journeyFixtures } from "@repo/util-e2e";

import { RankingProfileFactory } from "#database/factories/ranking-profile.factory.ts";

import { defineE2eScenario } from "./utilities/define-e2e-scenario.ts";

const { customProfile } = journeyFixtures.settings;

/** Riven holds its built-in ranking profiles and one custom profile */
export const e2eSettingsScenario = defineE2eScenario({
  scenarioName: "e2e-settings",
  async seed(em) {
    await new RankingProfileFactory(em).createOne({
      name: customProfile.name,
      description: customProfile.description,
      slug: null,
    });
  },
});
