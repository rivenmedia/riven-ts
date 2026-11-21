import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

it("returns true when a name is taken", async ({
  factories: { rankingProfileFactory },
  services: { rankingProfileService },
}) => {
  await rankingProfileFactory.createOne({
    name: "One",
    description: null,
  });

  await expect(rankingProfileService.nameExists("One")).resolves.toBe(true);
});

it("returns false when excluding the owning record's id", async ({
  factories: { rankingProfileFactory },
  services: { rankingProfileService },
}) => {
  const created = await rankingProfileFactory.createOne({
    name: "One",
    description: null,
  });

  await expect(
    rankingProfileService.nameExists("One", created.id),
  ).resolves.toBe(false);
});
