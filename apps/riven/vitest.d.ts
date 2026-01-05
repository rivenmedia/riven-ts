import "@vitest/expect";
import "vitest";

import type { EventFrom } from "xstate";

interface CustomMatchers<R = unknown> {
  toHaveReceivedEvent(expected: EventFrom<R>): void;
}

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<T = unknown> extends CustomMatchers<T> {}
}
