import { expect, it } from "vitest";

import { queueSummaries } from "../_fixtures/queues.fixture.ts";
import { groupQueues } from "./group-queues.ts";
import { sumJobCounts } from "./job-counts.ts";

it("keeps flows and sandboxed queues in input order", () => {
  expect.hasAssertions();

  const { flows, sandboxed } = groupQueues(queueSummaries);

  expect(flows.map((queue) => queue.name)).toStrictEqual(
    queueSummaries
      .filter((queue) => queue.kind === "flow")
      .map((item) => item.name),
  );
  expect(sandboxed.map((queue) => queue.name)).toStrictEqual(
    queueSummaries
      .filter((queue) => queue.kind === "sandboxed")
      .map((item) => item.name),
  );
  expect(flows).toHaveLength(10);
  expect(sandboxed).toHaveLength(3);
});

it("sorts plugin groups by display name", () => {
  expect.hasAssertions();

  const names = groupQueues(queueSummaries).plugins.map(
    (group) => group.plugin.displayName,
  );

  expect(names).toStrictEqual(
    names.toSorted((left, right) => left.localeCompare(right)),
  );
  expect(names.indexOf("Comet")).toBeLessThan(names.indexOf("Jellyfin"));
  expect(names.indexOf("StremThru")).toBeLessThan(names.indexOf("SubDL"));
  expect(names).toHaveLength(13);
});

it("sorts the queues within a group by name", () => {
  expect.hasAssertions();

  const stremthru = groupQueues(queueSummaries).plugins.find(
    (group) => group.plugin.id === "stremthru",
  );

  expect(stremthru?.queues).toHaveLength(6);
  expect(stremthru?.queues.map((queue) => queue.name)).toStrictEqual(
    stremthru?.queues.map((queue) => queue.name).toSorted(),
  );
});

it("sums a group's counts from its queues", () => {
  expect.hasAssertions();

  for (const group of groupQueues(queueSummaries).plugins) {
    expect(group.counts).toStrictEqual(
      sumJobCounts(group.queues.map((queue) => queue.counts)),
    );
  }
});

it("returns three empty arrays for no queues", () => {
  expect.hasAssertions();

  expect(groupQueues([])).toStrictEqual({
    flows: [],
    sandboxed: [],
    plugins: [],
  });
});
