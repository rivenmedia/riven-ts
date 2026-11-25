import type { UnhandledRequest } from "@repo/util-e2e";

const requests: UnhandledRequest[] = [];

export const unhandledRequests = {
  record(request: UnhandledRequest) {
    requests.push(request);
  },
  list() {
    return [...requests];
  },
  clear() {
    requests.length = 0;
  },
};
