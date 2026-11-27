import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { resolveLocale } from "#lib/utils/resolve-locale.ts";

import {
  getJobs,
  getLiveStatus,
  getNow,
  getQueue,
} from "../_data/queue-data.ts";
import { parseJobStateParam } from "../_utilities/job-states.ts";
import {
  decodeRouteParam,
  parsePageParam,
} from "../_utilities/queue-routes.ts";
import { QueuePage } from "./page.client";

export default async function QueueRoute({
  params,
  searchParams,
}: PageProps<"/queues/[queueName]">) {
  const [{ queueName: rawQueueName }, search, headersList] = await Promise.all([
    params,
    searchParams,
    headers(),
  ]);

  const queue = getQueue(decodeRouteParam(rawQueueName));

  if (!queue) {
    notFound();
  }

  const { state: stateParam, page: pageParam } = search;
  const state = parseJobStateParam(stateParam);
  const jobPage = getJobs(queue.name, state, parsePageParam(pageParam));

  return (
    <QueuePage
      queue={queue}
      state={state}
      jobPage={jobPage}
      liveStatus={getLiveStatus()}
      now={getNow()}
      locale={resolveLocale(headersList.get("accept-language"))}
    />
  );
}
