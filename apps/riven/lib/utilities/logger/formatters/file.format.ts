import { format } from "winston";

import { consoleFormat } from "./console.format.ts";

export const fileFormat = format.combine(consoleFormat, format.uncolorize());
