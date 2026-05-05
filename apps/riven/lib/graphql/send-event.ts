import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export let sendEvent: (event: RivenEvent) => void;

export const setSendEvent = (fn: typeof sendEvent) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!sendEvent) {
    sendEvent = fn;
  }
};
