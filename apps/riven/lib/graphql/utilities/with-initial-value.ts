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
  updates: AsyncIterable<T>,
  getInitialValue: () => Promise<T>,
) {
  const state = { hasReceivedUpdate: false };

  return Repeater.merge([
    (async function* emitInitialValue() {
      const initialValue = await getInitialValue();

      if (!state.hasReceivedUpdate) {
        yield initialValue;
      }
    })(),
    (async function* emitUpdates() {
      for await (const update of updates) {
        state.hasReceivedUpdate = true;

        yield update;
      }
    })(),
  ]);
}
