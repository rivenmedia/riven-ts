import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

import { Setting } from "./setting.entity.ts";

it("keys settings by namespace first", ({ orm }) => {
  expect(orm.getMetadata().get(Setting).primaryKeys).toStrictEqual([
    "namespace",
    "key",
  ]);
});
