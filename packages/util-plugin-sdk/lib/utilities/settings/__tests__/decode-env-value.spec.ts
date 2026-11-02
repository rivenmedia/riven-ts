import { expect, it } from "vitest";
import z from "zod";

import { decodeEnvValue } from "../decode-env-value.ts";

const LogLevelLike = z.enum(["error", "info", "debug"]);

it.each([
  ["[1,4,12]", z.tuple([z.int(), z.int(), z.int()]), [1, 4, 12]],
  ["12345", z.string(), "12345"],
  ["true", z.boolean(), true],
  ['["a"]', z.array(z.string()), ["a"]],
  ["30", z.int().default(30), 30],
  ["info", LogLevelLike, "info"],
  ["not-json", z.boolean(), "not-json"],
  ["abc", z.string().default("x"), "abc"],
  ["foo-1", z.templateLiteral(["foo-", z.number()]), "foo-1"],
])("decodes %s", (raw, schema, expected) => {
  expect(decodeEnvValue(raw, schema)).toStrictEqual(expected);
});
