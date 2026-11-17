import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

it("deletes the profile", async ({
  factories: { rankingProfileFactory },
  services: { rankingProfileService },
}) => {
  const { id } = await rankingProfileFactory.createOne();

  await rankingProfileService.delete(id);

  await expect(rankingProfileService.findById(id)).resolves.toBeNull();
});
