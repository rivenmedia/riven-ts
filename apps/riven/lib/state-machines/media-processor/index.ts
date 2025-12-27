import { processorActor } from "./actors/processor.actor.ts";
import { setup } from "xstate";

export const mediaProcessorMachine = setup({
  types: {},
  actors: {
    processorActor,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgFtIBLAQwAUAnLAYzli0vxAActZiAXYrDZgD0QBaAGzoAnsICsAOgCcCxUqUBmZGhBEIZKrXqMZxDFzIAbAMqdSnMMzYduvAYgAsAJgmIAHAEYZLxV85KRE5FykpdXUgA */
  id: "Media Processor",
  initial: "Waiting",
  states: {
    Waiting: {
      invoke: {
        src: "processorActor",
      },
    },
    Processing: {},
  },
});
