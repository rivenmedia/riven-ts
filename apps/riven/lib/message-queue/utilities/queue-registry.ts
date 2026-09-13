import type { Queue } from "bullmq";

export const queueRegistry = new Map<string, Queue>();
