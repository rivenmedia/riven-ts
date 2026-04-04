import { SPLAT } from "triple-beam";
import { format } from "winston";

import { ErrorSplat } from "../schemas/error-splat.schema.ts";

export const validationErrorMetaFormat = format((info) => {
  const parsedSplat = Array.isArray(info[SPLAT])
    ? ErrorSplat(info[SPLAT][0])
    : undefined;

  if (parsedSplat) {
    info["riven.error.validation-message"] = parsedSplat.summary;
  }

  return info;
});
