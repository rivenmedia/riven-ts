import { registerEnumType } from "type-graphql";
import { z } from "zod";

export const SecretState = z.enum(["default", "custom", "env", "unset"]);

export type SecretState = z.infer<typeof SecretState>;

registerEnumType(SecretState.enum, {
  name: "SecretState",
  description:
    "Where a secret field's current value comes from. The value itself is never exposed.",
});
