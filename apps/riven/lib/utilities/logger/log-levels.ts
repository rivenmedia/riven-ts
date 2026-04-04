import { type } from "arktype";

export const LogLevel = type.enumerated(
  "error",
  "warn",
  "info",
  "http",
  "verbose",
  "debug",
  "silly",
);

export type LogLevel = typeof LogLevel.infer;
