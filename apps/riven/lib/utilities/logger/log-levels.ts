import z from "zod";

export const LogLevel = z.enum([
  "error",
  "warn",
  "info",
  "http",
  "verbose",
  "debug",
  "silly",
]);

export type LogLevel = z.infer<typeof LogLevel>;
