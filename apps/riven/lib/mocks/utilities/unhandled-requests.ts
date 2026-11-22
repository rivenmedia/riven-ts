export interface UnhandledRequest {
  method: string;
  url: string;
}

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
