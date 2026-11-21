import { expect, it } from "vitest";

import { browserSupportsPasskeys } from "./browser-supports-passkeys.ts";

const createWindow = (PublicKeyCredential: unknown) =>
  ({ PublicKeyCredential }) as unknown as typeof globalThis.window;

it("supports passkeys when conditional mediation can be checked", () => {
  expect(
    browserSupportsPasskeys(
      createWindow({
        isConditionalMediationAvailable: async () => Promise.resolve(true),
      }),
    ),
  ).toBe(true);
});

it.for([
  { label: "WebAuthn is unavailable", credential: undefined },
  { label: "conditional mediation is unsupported", credential: {} },
])("does not support passkeys when $label", ({ credential }) => {
  expect(browserSupportsPasskeys(createWindow(credential))).toBe(false);
});
