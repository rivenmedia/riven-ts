import type { RequestedItem } from "@repo/util-plugin-sdk";
import { setup } from "xstate";

export const mediaRequestMachine = setup({
  types: {
    input: {} as RequestedItem,
  },
}).createMachine({
  id: "Media request",
  initial: "Idle",
  states: {
    Idle: {},
  },
});
