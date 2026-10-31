import { createPubSub } from "@graphql-yoga/subscription";
import { expect, it } from "vitest";

import { withInitialValue } from "./with-initial-value.ts";

const waitForListeners = async () =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

it("emits the initial value, followed by any updates", async ({
  onTestFinished,
}) => {
  const pubSub = createPubSub<{ VALUE_CHANGED: [value: number] }>();
  const iterator = withInitialValue(pubSub.subscribe("VALUE_CHANGED"), () =>
    Promise.resolve(1),
  );

  onTestFinished(async () => {
    await iterator.return();
  });

  await expect(iterator.next()).resolves.toStrictEqual({
    done: false,
    value: 1,
  });

  const nextValue = iterator.next();

  pubSub.publish("VALUE_CHANGED", 2);

  await expect(nextValue).resolves.toStrictEqual({ done: false, value: 2 });
});

it("discards the initial value if an update is received first", async ({
  onTestFinished,
}) => {
  const pubSub = createPubSub<{ VALUE_CHANGED: [value: number] }>();
  const initialValue = Promise.withResolvers<number>();
  const iterator = withInitialValue(
    pubSub.subscribe("VALUE_CHANGED"),
    async () => initialValue.promise,
  );

  onTestFinished(async () => {
    await iterator.return();
  });

  const firstValue = iterator.next();

  await waitForListeners();

  pubSub.publish("VALUE_CHANGED", 2);

  await expect(firstValue).resolves.toStrictEqual({ done: false, value: 2 });

  initialValue.resolve(1);

  const secondValue = iterator.next();

  await waitForListeners();

  pubSub.publish("VALUE_CHANGED", 3);

  await expect(secondValue).resolves.toStrictEqual({ done: false, value: 3 });
});
