import { registerEnumType } from "type-graphql";

export const LogLevel = {
  TRACE: "TRACE",
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  CRITICAL: "CRITICAL",
} as const;

registerEnumType(LogLevel, {
  name: "LogLevel",
  description: "The levels of logging severity",
});
