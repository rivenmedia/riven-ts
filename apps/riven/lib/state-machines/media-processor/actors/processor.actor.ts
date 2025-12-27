import { fromCallback } from "xstate";

export const processorActor = fromCallback(({ receive, sendBack }) => {
  // Placeholder for media processing logic
  console.log("Processor actor started.");

  return () => {
    console.log("Processor actor stopped.");
  };
});
