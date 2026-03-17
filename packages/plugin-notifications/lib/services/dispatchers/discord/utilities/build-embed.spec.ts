import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { expect } from "vitest";

import { notificationPayloadFixture } from "../../../__tests__/payload.fixture.ts";
import { buildEmbed } from "./build-embed.ts";

it("includes the thumbnail when posterPath is provided", () => {
  const embed = buildEmbed(notificationPayloadFixture);

  expect(embed.thumbnail).toEqual({
    url: notificationPayloadFixture.posterPath,
  });
});

it("does not include the thumbnail when posterPath is null", () => {
  const embed = buildEmbed({ ...notificationPayloadFixture, posterPath: null });

  expect(embed.thumbnail).toBeUndefined();
});
