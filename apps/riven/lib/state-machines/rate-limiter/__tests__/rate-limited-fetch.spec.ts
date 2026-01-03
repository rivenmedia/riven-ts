import { DateTime } from "luxon";
import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";
import { createActor, toPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it("defaults to 3 maxRetries when not provided", ({ actor }) => {
  expect(actor.getSnapshot().context.maxRetries).toBe(3);
});

it("fetches data successfully", async ({ actor, input, server, validData }) => {
  server.use(http.get(input.url, () => HttpResponse.json(validData)));

  actor.send({ type: "fetch" });

  const result = await toPromise(actor);

  expect(await result.json()).toEqual(validData);
});

it("throws an error on an error status code that isn't 429", async ({
  actor,
  input,
  server,
}) => {
  server.use(
    http.get(input.url, () => HttpResponse.json(undefined, { status: 500 })),
  );

  actor.send({ type: "fetch" });

  await expect(() => toPromise(actor)).rejects.toThrow();
});

it("retries after receiving a 429 response", async ({
  actor,
  input,
  server,
  validData,
}) => {
  vi.useFakeTimers();

  server.use(
    http.get(
      input.url,
      () =>
        HttpResponse.json(undefined, {
          status: 429,
          headers: {
            "Retry-After": "1",
          },
        }),
      { once: true },
    ),
    http.get(input.url, () => HttpResponse.json(validData)),
  );

  actor.send({ type: "fetch" });

  actor.subscribe((event) => {
    if (event.value === "Rate limited") {
      vi.runOnlyPendingTimers();
    }
  });

  await toPromise(actor);

  expect(actor.getSnapshot().context.requestAttempts).toBe(2);
});

it("throws an error when max retries are reached", async ({
  machine,
  input,
  server,
}) => {
  vi.useFakeTimers();

  const expectedRetries = 5;

  const actor = createActor(machine, {
    input: {
      ...input,
      maxRetries: expectedRetries,
    },
  });

  server.use(
    http.get(input.url, () =>
      HttpResponse.json(undefined, {
        status: 429,
        headers: {
          "Retry-After": "1",
        },
      }),
    ),
  );

  actor.start();
  actor.send({ type: "fetch" });

  actor.send({ type: "fetch" });

  actor.subscribe((event) => {
    if (event.value === "Rate limited") {
      vi.runOnlyPendingTimers();
    }
  });

  await expect(toPromise(actor)).rejects.toThrow();

  expect(actor.getSnapshot().context.requestAttempts).toBe(1 + expectedRetries);
});

it('waits the appropriate time before retrying after receiving a numeric "Retry-After" header', async ({
  actor,
  input,
  server,
  validData,
}) => {
  vi.useFakeTimers();

  const rateLimitDelaysMs = [5000, 10000];

  server.use(
    ...rateLimitDelaysMs.map((delayMs) =>
      http.get(
        input.url,
        () =>
          HttpResponse.json(undefined, {
            status: 429,
            headers: {
              "Retry-After": (delayMs / 1000).toString(),
            },
          }),
        { once: true },
      ),
    ),
    http.get(input.url, () => HttpResponse.json(validData)),
  );

  actor.send({ type: "fetch" });

  for (const delay of rateLimitDelaysMs) {
    await vi.waitFor(() => {
      expect(actor.getSnapshot().value).toBe("Rate limited");
    });

    vi.advanceTimersByTime(delay - 1000);

    expect(actor.getSnapshot().value).toBe("Rate limited");

    vi.advanceTimersByTime(1000);

    expect(actor.getSnapshot().value).toBe("Fetching");
  }
});

it('waits the appropriate time before retrying after receiving a datetime "Retry-After" header', async ({
  actor,
  input,
  server,
  validData,
}) => {
  vi.useFakeTimers();

  const rateLimitDelaysMs = [5000, 10000];

  server.use(
    ...rateLimitDelaysMs.map((delayMs) =>
      http.get(
        input.url,
        () =>
          HttpResponse.json(undefined, {
            status: 429,
            headers: {
              "Retry-After": DateTime.now()
                .plus({ milliseconds: delayMs })
                .toHTTP(),
            },
          }),
        { once: true },
      ),
    ),
    http.get(input.url, () => HttpResponse.json(validData)),
  );

  actor.send({ type: "fetch" });

  for (const delay of rateLimitDelaysMs) {
    await vi.waitFor(() => {
      expect(actor.getSnapshot().value).toBe("Rate limited");
    });

    vi.advanceTimersByTime(delay - 1000);

    expect(actor.getSnapshot().value).toBe("Rate limited");

    vi.advanceTimersByTime(1000);

    expect(actor.getSnapshot().value).toBe("Fetching");
  }
});
