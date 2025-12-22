import { registerEnumType } from "type-graphql";

export const LogLevel = {
  SILLY: "SILLY",
  DEBUG: "DEBUG",
  VERBOSE: "VERBOSE",
  HTTP: "HTTP",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
} as const;

registerEnumType(LogLevel, {
  name: "LogLevel",
  description: "The levels of logging severity",
});
