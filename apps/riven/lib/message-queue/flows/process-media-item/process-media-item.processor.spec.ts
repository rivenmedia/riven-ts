import { it } from "../../../__tests__/test-context.ts";

it.todo('enqueues item scraping if the step is "scrape"');

it.todo(
  'enqueues item scraping in the future if the step is "scrape" and the next scrape timestamp is set',
);

it.todo(
  'enqueues item downloading if the step is "download", scraping has succeeded, and the item is not in the "failed" state',
);

it.todo(
  'throws an UnrecoverableError if the step is "downloaded" and scraping has not succeeded',
);

it.todo(
  'throws an UnrecoverableError if the step is "downloaded" and the item is in the "failed" state',
);
