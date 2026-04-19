import { AsyncLocalStorage } from "node:async_hooks";

import type { Job } from "bullmq";

export interface DataSourceContext {
  job: Job;
}

export const dataSourceContext = new AsyncLocalStorage<DataSourceContext>();
