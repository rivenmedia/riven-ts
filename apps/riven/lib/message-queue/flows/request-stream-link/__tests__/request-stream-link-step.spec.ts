import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import { flow } from "../../producer.ts";
import { enqueueRequestStreamLink } from "../enqueue-request-stream-link.ts";

it("requests the stream link from the plugin associated with the media entry", async ({
  completedMovieContext: { completedMovie },
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  const { job } = await enqueueRequestStreamLink({
    mediaEntry,
  });

  expect.assert(job.id);

  const f = await flow.getFlow({
    id: job.id,
    queueName: "request-stream-link",
  });

  console.log(f);
});

it.todo(
  'moves the job to the "validate-link" step after requesting the stream link',
);

it.todo(
  "throws a WaitingChildrenError if the job has to wait for the stream link response",
);
