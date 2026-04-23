import { AsyncLocalStorage } from "node:async_hooks";

import type { Job } from "bullmq";

export interface DataSourceContext {
  job: Job;
  token: string;
}

export const dataSourceContext = new AsyncLocalStorage<DataSourceContext>();
