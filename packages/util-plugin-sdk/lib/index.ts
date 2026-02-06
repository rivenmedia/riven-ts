import z from "zod";
import { createErrorMap } from "zod-validation-error";

// Improve Zod's error messages by including the input value in the error report
z.config({
  customError: createErrorMap({
    reportInput: "typeAndValue",
  }),
});

export * from "./datasource/index.ts";

export * from "./decorators/index.ts";

export * from "./helpers/get-stremio-scrape-config.ts";

export * from "./schemas/index.ts";
export * from "./schemas/settings.type.ts";

export * from "./types/events.ts";
export * from "./utilities/datasource-map.ts";
