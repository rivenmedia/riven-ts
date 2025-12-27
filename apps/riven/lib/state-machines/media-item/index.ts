import { setup } from "xstate";

interface MediaItemMachineInput {
  id: string;
}

export const mediaItemMachine = setup({
  types: {
    input: {} as MediaItemMachineInput,
  },
}).createMachine({
  id: "mediaItem",
  initial: "Requested",
  states: {
    Requested: {},
    Paused: {},
    PartiallyCompleted: {},
    Ongoing: {},
    Indexed: {},
    Scraped: {},
    Downloaded: {},
    Symlinked: {},
    Failed: {
      type: "final",
    },
    Completed: {
      type: "final",
    },
  },
});
