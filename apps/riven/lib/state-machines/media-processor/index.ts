import { processorActor } from "./actors/processor.actor.ts";
import { setup } from "xstate";

export const mediaProcessorMachine = setup({
  types: {},
  actors: {
    processorActor,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgFlIBLAQwAIAFAJywGM5Ytr8QAHLWYgF2Kw1YAPRAFoAbOgCeoscjQgiEMlVoNYTagDoA6qR7EMUVhy69+QxABYATFMQAOAIyaArHPSLlNeo2abvalyGxpz65kggwgj2AOyalpaOlgAMYtYudgiOsXJyQA */
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
