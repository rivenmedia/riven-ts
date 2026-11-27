import { expect, it } from "vitest";

import { emptyJobCounts, sumJobCounts } from "./job-counts.ts";

it("sums no counts to the empty counts", () => {
  expect(sumJobCounts([])).toStrictEqual(emptyJobCounts());
});

it("adds counts per state", () => {
  const a = { ...emptyJobCounts(), active: 2, failed: 1 };
  const b = { ...emptyJobCounts(), active: 3, waiting: 4 };

  expect(sumJobCounts([a, b])).toStrictEqual({
    ...emptyJobCounts(),
    active: 5,
    failed: 1,
    waiting: 4,
  });
});
