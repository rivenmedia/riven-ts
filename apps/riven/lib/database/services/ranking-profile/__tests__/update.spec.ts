import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

it("persists name, description, and config changes", async ({
  services: { rankingProfileService },
}) => {
  const { id } = await rankingProfileService.create({
    name: "One",
    description: null,
    config: {},
  });

  const updated = await rankingProfileService.update(id, {
    name: "Two",
    description: "d",
    config: { rankingModel: { av1: 5 } },
  });

  expect(updated).toMatchObject({
    name: "Two",
    description: "d",
    rankingModel: { av1: 5 },
  });
});
