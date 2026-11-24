import { Router } from "express";
import z from "zod";

import { isApiKey, readBearerToken } from "#graphql/auth/api-key.ts";
import { scenarios } from "#mocks/scenarios/index.ts";
import { unhandledRequests } from "#mocks/utilities/unhandled-requests.ts";

import { resetInstance } from "./reset-instance.ts";
import { mockScenarioNames } from "./scenario-names.ts";

import type { ResetInstanceDeps } from "./reset-instance.ts";

const ApplyScenarioBody = z.object({ scenario: z.enum(mockScenarioNames) });

/**
 * The test-mode control endpoint that E2E tests use to reset Riven between tests.
 * Every route requires `Authorization: Bearer <apiKey>`, checked as the GraphQL API checks it.
 */
export function createE2eControlRouter(deps: ResetInstanceDeps): Router {
  const router = Router();

  router.use((req, res, next) => {
    const token = readBearerToken(req.get("authorization"));

    void (token === undefined ? Promise.resolve(false) : isApiKey(token)).then(
      (isValid) => {
        if (!isValid) {
          res.status(401).json({ error: "Missing or invalid API key" });

          return;
        }

        next();
      },
      next,
    );
  });

  router.post("/scenario", (req, res, next) => {
    const body = ApplyScenarioBody.safeParse(req.body);
    const scenario = body.success ? scenarios[body.data.scenario] : undefined;

    if (!scenario) {
      res.status(400).json({
        error: `Unknown mock scenario: ${JSON.stringify(req.body)}`,
      });

      return;
    }

    // Every test-mode instance boots with the same environment, so a reset can't apply a scenario's
    if (scenario.environmentData) {
      res.status(400).json({
        error: `Mock scenario "${scenario.scenarioName}" sets environment data, which test mode can't apply`,
      });

      return;
    }

    resetInstance(deps, scenario).then(() => {
      res.sendStatus(204);
    }, next);
  });

  router.get("/unhandled-requests", (_req, res) => {
    res.json({ requests: unhandledRequests.list() });
  });

  return router;
}
