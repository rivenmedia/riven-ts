import { expect, it as baseIt } from "vitest";

import { browserSupportsPasskeys } from "./browser-supports-passkeys.ts";

const it = baseIt.extend(
  "createWindow",
  () => (PublicKeyCredential: unknown) =>
    ({ PublicKeyCredential }) as unknown as typeof globalThis.window,
);

it("supports passkeys when conditional mediation can be checked", ({
  createWindow,
}) => {
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
])(
  "does not support passkeys when $label",
  ({ credential }, { createWindow }) => {
    expect(browserSupportsPasskeys(createWindow(credential))).toBe(false);
  },
);
