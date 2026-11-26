import { e2eUsers } from "@repo/util-e2e";

import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { User } from "#database/entities/user.entity.ts";

import { e2eBaselineScenario } from "../e2e-baseline.scenario.ts";
import { defineE2eScenario } from "./define-e2e-scenario.ts";

it("seeds the baseline before its own seed", async ({ em, orm }) => {
  let usersSeenByOwnSeed = 0;

  const scenario = defineE2eScenario({
    scenarioName: "e2e-library",
    async seed(scenarioEm) {
      usersSeenByOwnSeed = await orm.em.fork().count(User);
      await Promise.resolve(scenarioEm);
    },
  });

  await scenario.seed(em);

  expect(usersSeenByOwnSeed).toBe(Object.keys(e2eUsers).length);
});

it("takes its name from the definition", () => {
  const scenario = defineE2eScenario({ scenarioName: "e2e-library" });

  expect(scenario.scenarioName).toBe("e2e-library");
  expect(scenario.handlers).toStrictEqual(e2eBaselineScenario.handlers);
});

it("answers a request with its own handler before the baseline's", async ({
  server,
}) => {
  const url = "https://api.themoviedb.org/3/genre/movie/list";
  const scenario = defineE2eScenario({
    scenarioName: "e2e-library",
    handlers: [http.get(url, () => HttpResponse.json({ genres: [] }))],
  });

  server.use(...(scenario.handlers ?? []));

  await expect(
    fetch(url).then((response) => response.json()),
  ).resolves.toStrictEqual({ genres: [] });
});
