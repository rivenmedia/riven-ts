import { format } from "winston";

import { createConsoleFormat } from "./console.format.ts";

import type { ConsoleFormatOptions } from "./console.format.ts";

export const createFileFormat = (options: ConsoleFormatOptions) =>
  format.combine(createConsoleFormat(options), format.uncolorize());
