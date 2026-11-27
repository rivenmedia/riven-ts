import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { resolveLocale } from "#lib/utils/resolve-locale.ts";

import { getJob, getLiveStatus, getQueue } from "../../../_data/queue-data.ts";
import { FIXTURE_NOW } from "../../../_fixtures/jobs.fixture.ts";
import { decodeRouteParam } from "../../../_utilities/queue-routes.ts";
import { JobPage } from "./page.client";

export default async function JobRoute({
  params,
}: PageProps<"/queues/[queueName]/jobs/[jobId]">) {
  const [{ queueName: rawQueueName, jobId: rawJobId }, headersList] =
    await Promise.all([params, headers()]);

  const queueName = decodeRouteParam(rawQueueName);
  const queue = getQueue(queueName);
  const job = getJob(queueName, decodeRouteParam(rawJobId));

  if (!queue || !job) {
    notFound();
  }

  return (
    <JobPage
      job={job}
      queue={queue}
      liveStatus={getLiveStatus()}
      now={FIXTURE_NOW}
      locale={resolveLocale(headersList.get("accept-language"))}
    />
  );
}
