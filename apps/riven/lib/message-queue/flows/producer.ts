import { createFlowProducer } from "../utilities/create-flow-producer.ts";

export const flow = createFlowProducer({
  defaultJobOptions: {
    removeOnComplete: {
      age: 60 * 60,
      count: 1000,
    },
    removeOnFail: {
      age: 24 * 60 * 60,
      count: 5000,
    },
  },
});
