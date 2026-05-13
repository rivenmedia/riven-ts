import { Agent, interceptors, setGlobalDispatcher } from "undici";

import { config } from "../../config.ts";

const requestAgent = new Agent({
  keepAliveMaxTimeout: config.activityTimeoutSeconds * 1000,
  connect: {
    timeout: config.connectTimeoutSeconds * 1000,
    rejectUnauthorized: false,
  },
}).compose(interceptors.retry(), interceptors.redirect());

setGlobalDispatcher(requestAgent);
