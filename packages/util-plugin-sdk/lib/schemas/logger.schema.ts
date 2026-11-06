import z from "zod";

import type { Logger } from "winston";

export const LoggerSchema = z.custom<Logger>(
  (val) => val && typeof val === "object" && "info" in val && "error" in val,
);
