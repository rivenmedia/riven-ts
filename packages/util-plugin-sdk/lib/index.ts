import z from "zod";
import { createErrorMap } from "zod-validation-error";

// Improve Zod's error messages by including the input value in the error report
z.config({
  customError: createErrorMap({
    reportInput: "typeAndValue",
  }),
});
