import { SPLAT } from "triple-beam";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { validationErrorMetaFormat } from "./validation-error-meta.format.ts";

describe("validationErrorMetaFormat", () => {
  it("adds validation message for ZodError in SPLAT err property", () => {
    const zodError = new ZodError([
      {
        code: "invalid_type",
        expected: "string",
        input: "number",
        path: ["field"],
        message: "Expected string, received number",
      },
    ]);

    const info = {
      level: "error",
      message: "Validation failed",
      [SPLAT]: [{ err: zodError }],
    };

    const result = validationErrorMetaFormat().transform(info);

    expect(result).toHaveProperty("riven.error.validation-message");
  });

  it("does not add validation message for regular Error in SPLAT", () => {
    const info = {
      level: "error",
      message: "Error",
      [SPLAT]: [{ err: new Error("regular error") }],
    };

    const result = validationErrorMetaFormat().transform(info);

    expect(result).not.toHaveProperty("riven.error.validation-message");
  });
});
