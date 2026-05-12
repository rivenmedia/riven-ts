import { client, gql } from "$lib/graphql";

import type { PageLoad } from "./$types";

const QUEUES_OVERVIEW = gql`
  query QueuesOverview {
    queues {
      name
      counts {
        waiting
        active
        completed
        failed
        delayed
        paused
      }
    }
  }
`;

const QUEUE_JOBS = gql`
  query QueueJobs(
    $queue: String!
    $status: JobStatus
    $limit: Int
    $offset: Int
  ) {
    jobs(queue: $queue, status: $status, limit: $limit, offset: $offset) {
      edges {
        node {
          id
          name
          data
          attemptsMade
          failedReason
          processedOn
          finishedOn
          timestamp
        }
      }
      total
    }
  }
`;

export type JobStatus = "waiting" | "active" | "completed" | "failed";

export interface QueueCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface QueueOverview {
  name: string;
  counts: QueueCounts;
}

export interface QueueJob {
  id: string;
  name: string;
  data: unknown;
  attemptsMade: number;
  failedReason: string | null;
  processedOn: number | null;
  finishedOn: number | null;
  timestamp: number;
}

export interface QueueJobsPage {
  edges: { node: QueueJob }[];
  total: number;
}

export interface QueueLoadResult {
  queues: QueueOverview[];
  jobs: QueueJobsPage | null;
  selectedQueue: string | null;
  selectedStatus: JobStatus;
  resolverMissing: boolean;
  errorMessage: string | null;
}

const STATUSES: readonly JobStatus[] = [
  "waiting",
  "active",
  "completed",
  "failed",
];

function isSchemaMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /Cannot query field/i.test(msg) ||
    /Unknown type/i.test(msg) ||
    /Field .* doesn't exist/i.test(msg) ||
    /not found in schema/i.test(msg)
  );
}

export const load: PageLoad = async ({ url }): Promise<QueueLoadResult> => {
  const selectedQueueParam = url.searchParams.get("queue");
  const statusParam = url.searchParams.get("status") as JobStatus | null;
  const selectedStatus: JobStatus =
    statusParam && STATUSES.includes(statusParam) ? statusParam : "waiting";

  try {
    const overviewResult = await client.query<{ queues: QueueOverview[] }>({
      query: QUEUES_OVERVIEW,
      fetchPolicy: "network-only",
    });

    const queues = overviewResult.data?.queues ?? [];
    const selectedQueue =
      selectedQueueParam && queues.some((q) => q.name === selectedQueueParam)
        ? selectedQueueParam
        : (queues[0]?.name ?? null);

    let jobs: QueueJobsPage | null = null;
    if (selectedQueue) {
      try {
        const jobsResult = await client.query<{ jobs: QueueJobsPage }>({
          query: QUEUE_JOBS,
          variables: {
            queue: selectedQueue,
            status: selectedStatus,
            limit: 50,
            offset: 0,
          },
          fetchPolicy: "network-only",
        });
        jobs = jobsResult.data?.jobs ?? null;
      } catch (jobsErr) {
        if (!isSchemaMissing(jobsErr)) throw jobsErr;
        jobs = null;
      }
    }

    return {
      queues,
      jobs,
      selectedQueue,
      selectedStatus,
      resolverMissing: false,
      errorMessage: null,
    };
  } catch (err) {
    if (isSchemaMissing(err)) {
      return {
        queues: [],
        jobs: null,
        selectedQueue: null,
        selectedStatus,
        resolverMissing: true,
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
    return {
      queues: [],
      jobs: null,
      selectedQueue: null,
      selectedStatus,
      resolverMissing: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
};
