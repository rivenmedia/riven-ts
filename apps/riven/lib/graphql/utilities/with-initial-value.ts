import { Repeater } from "@graphql-yoga/subscription";

/**
 * Creates a subscription iterator that emits an initial value, followed by any subsequent updates.
 *
 * Updates are listened to before the initial value is resolved, so none are missed in between.
 * If an update is received first, the initial value is discarded as it may be stale.
 *
 * @param updates The iterator that emits updates, e.g. from `pubSub.subscribe`
 * @param getInitialValue Resolves the value to emit before any updates
 * @returns An iterator that emits the initial value, followed by any updates
 */
export function withInitialValue<T>(
  updates: AsyncIterableIterator<T>,
  getInitialValue: () => Promise<T>,
) {
  return new Repeater<T>(async (push, stop) => {
    const state = { hasReceivedUpdate: false };

    // Returning the updates iterator ends any pending wait for the next update,
    // which an async generator would otherwise block on until an update is received
    void stop.then(async () => updates.return?.());

    const forwardingUpdates = (async () => {
      for await (const update of updates) {
        state.hasReceivedUpdate = true;

        await push(update);
      }
    })();

    const initialValue = await getInitialValue();

    if (!state.hasReceivedUpdate) {
      await push(initialValue);
    }

    await forwardingUpdates;
  });
}
