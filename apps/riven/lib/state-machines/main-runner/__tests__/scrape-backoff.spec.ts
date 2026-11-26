import { Duration } from "luxon";
import { expect } from "vitest";
import { waitFor } from "xstate";

import { it } from "./helpers/test-context.ts";

const hours = (count: number) =>
  Duration.fromObject({ hours: count }).toMillis();

it.for([
  { attemptsMade: 0, delay: Duration.fromObject({ minutes: 30 }).toMillis() },
  { attemptsMade: 1, delay: Duration.fromObject({ minutes: 30 }).toMillis() },
  { attemptsMade: 2, delay: hours(3) },
  { attemptsMade: 4, delay: hours(3) },
  { attemptsMade: 5, delay: hours(7) },
  { attemptsMade: 9, delay: hours(7) },
  { attemptsMade: 10, delay: hours(48) },
  { attemptsMade: 25, delay: hours(48) },
])(
  "retries a scrape after $attemptsMade failed attempts with the configured cooldown",
  async ({ attemptsMade, delay }, { actor, overrideRuntimeSettings }) => {
    overrideRuntimeSettings({
      general: { scraping: { scrapeCooldownHours: [3, 7, 48] } },
    });

    actor.start();

    const snapshot = await waitFor(actor, (state) => state.matches("Running"));
    const backoffStrategy =
      snapshot.context.flowWorkers?.["scrape-item"].worker.opts.settings
        ?.backoffStrategy;

    expect.assert(backoffStrategy);

    expect(backoffStrategy(attemptsMade, "custom")).toBe(delay);
  },
);
