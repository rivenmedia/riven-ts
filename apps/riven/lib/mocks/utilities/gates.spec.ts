import { setImmediate } from "node:timers/promises";
import { it as baseIt, expect } from "vitest";

import { gates } from "./gates.ts";

// Every test leaves the gates as it found them
const it = baseIt.extend("clearGates", { auto: true }, ({}, { onCleanup }) => {
  onCleanup(() => {
    gates.clear();
    gates.reopen();
  });
});

const pending = Symbol("pending");

/** Settles with `pending` if the promise is still pending once the queued callbacks have run */
const settledValue = async (promise: Promise<unknown>) =>
  Promise.race([promise, setImmediate(pending)]);

it("wait blocks until release", async () => {
  gates.open("held");

  const released = gates.wait("held");

  await expect(settledValue(released)).resolves.toBe(pending);

  gates.release("held");

  await expect(released).resolves.toBe(true);
});

it("a released key doesn't block", async () => {
  gates.release("released-early");
  gates.open("released-early");

  await expect(settledValue(gates.wait("released-early"))).resolves.toBe(true);
});

it("clear releases pending waits and forgets every key", async () => {
  gates.open("held");

  const held = gates.wait("held");

  gates.release("released");
  gates.clear();

  await expect(held).resolves.toBe(false);

  gates.reopen();
  gates.open("released");

  await expect(settledValue(gates.wait("released"))).resolves.toBe(pending);
});

it("a wait that starts after clear is abandoned at once, until the gates reopen", async () => {
  gates.clear();

  await expect(settledValue(gates.wait("late"))).resolves.toBe(false);

  gates.reopen();

  await expect(settledValue(gates.wait("late"))).resolves.toBe(pending);
});
