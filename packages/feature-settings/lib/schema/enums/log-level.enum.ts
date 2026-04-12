import { registerEnumType } from "type-graphql";

export const LogLevel = {
  SILLY: "silly",
  DEBUG: "debug",
  VERBOSE: "verbose",
  HTTP: "http",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
} as const;

registerEnumType(LogLevel, {
  name: "LogLevel",
  description: "The levels of logging severity",
});
