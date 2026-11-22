import { Router } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import z from "zod";

import { scenarios } from "#mocks/scenarios/index.ts";
import { unhandledRequests } from "#mocks/utilities/unhandled-requests.ts";

import { resetInstance } from "./reset-instance.ts";
import { mockScenarioNames } from "./scenario-names.ts";

import type { ResetInstanceDeps } from "./reset-instance.ts";

const ApplyScenarioBody = z.object({ scenario: z.enum(mockScenarioNames) });

// Comparing digests gives `timingSafeEqual` inputs of equal length,
// so a wrong key's length cannot short-circuit the comparison.
function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

/**
 * The test-mode control endpoint that E2E tests use to reset Riven between tests.
 * Every route requires `Authorization: Bearer <apiKey>`.
 */
export function createE2eControlRouter({
  apiKey,
  ...deps
}: ResetInstanceDeps & { apiKey: string }): Router {
  const router = Router();
  const authorizationDigest = digest(`Bearer ${apiKey}`);

  router.use((req, res, next) => {
    const authorization = req.get("authorization") ?? "";

    if (!timingSafeEqual(digest(authorization), authorizationDigest)) {
      res.status(401).json({ error: "Missing or invalid API key" });

      return;
    }

    next();
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

    resetInstance(deps, scenario).then(() => {
      res.sendStatus(204);
    }, next);
  });

  router.get("/unhandled-requests", (_req, res) => {
    res.json({ requests: unhandledRequests.list() });
  });

  return router;
}
