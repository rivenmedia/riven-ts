import { z } from "@repo/util-plugin-sdk/validation";

import { registerEnumType } from "type-graphql";

export const LogLevel = z.enum([
  "silly",
  "debug",
  "verbose",
  "http",
  "info",
  "warn",
  "error",
]);

export type LogLevel = z.infer<typeof LogLevel>;

registerEnumType(LogLevel.enum, {
  name: "LogLevel",
  description: "The levels of logging severity",
});
