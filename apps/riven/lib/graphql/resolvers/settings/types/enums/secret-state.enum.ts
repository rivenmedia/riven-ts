import { registerEnumType } from "type-graphql";

export const SecretState = {
  DEFAULT: "default",
  CUSTOM: "custom",
  ENV: "env",
  UNSET: "unset",
} as const;

export type SecretState = (typeof SecretState)[keyof typeof SecretState];

registerEnumType(SecretState, {
  name: "SecretState",
  description:
    "Where a secret field's current value comes from. The value itself is never exposed.",
});
