import { SPLAT } from "triple-beam";
import { format } from "winston";
import z from "zod";

import { ErrorSplat } from "../schemas/error-splat.schema.ts";

export const validationErrorMetaFormat = format((info) => {
  const parsedSplat = Array.isArray(info[SPLAT])
    ? ErrorSplat.safeParse(info[SPLAT][0])
    : undefined;

  if (parsedSplat?.data) {
    info["riven.error.validation-message"] = z.prettifyError(parsedSplat.data);
  }

  return info;
});
