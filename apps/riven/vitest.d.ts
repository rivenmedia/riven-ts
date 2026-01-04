import "@vitest/expect";
import "vitest";
import type { EventFrom } from "xstate";

interface CustomMatchers<R = unknown> {
  toHaveReceivedEvent(expected: EventFrom<R>): void;
}

declare module "vitest" {
  interface Matchers<T = unknown> extends CustomMatchers<T> {}
}
