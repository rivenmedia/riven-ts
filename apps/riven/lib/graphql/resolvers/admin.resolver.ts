import { DateTime } from "luxon";
import { Arg, Int, Query, Resolver } from "type-graphql";

import { AdminContext } from "../decorators/admin-context.ts";
import { JobStatus } from "../enums/job-status.enum.ts";
import { Plugin, PluginLastError } from "../types/plugin.type.ts";
import {
  QueueJob,
  QueueJobEdge,
  QueueJobsPage,
} from "../types/queue-job.type.ts";
import { QueueCounts, QueueOverview } from "../types/queue-overview.type.ts";

import type { AdminPluginRecord } from "@repo/core-util-graphql-schema";
import type { JobType, Queue } from "bullmq";

// One entry in the AdminPluginRecord map. Pulled inline because the package
// only exports the map alias, not the value type.
type RegisteredPluginEntry =
  AdminPluginRecord extends ReadonlyMap<symbol, infer V> ? V : never;

/** Hard upper bound on `jobs(limit)` — mirrors `MAX_MEDIA_ITEMS_LIMIT` in media-item.resolver.ts. */
const MAX_JOBS_LIMIT = 100;

/** Default page size when callers omit `limit`. Matches the dashboard's request. */
const DEFAULT_JOBS_LIMIT = 50;

// The registry does not currently track:
//   - a timestamp for `invalid` failures (we use the query-resolve time so the
//     dashboard has something monotonically increasing to sort on)
//   - hydrated plugin settings (only the Zod `settingsSchema` is on `config`)
// Both gaps are intentional and surfaced as `null` rather than fabricated.
function projectPlugin(registered: RegisteredPluginEntry): Plugin {
  const { config, status } = registered;
  const name = config.name.description ?? config.name.toString();
  const capabilities = Object.keys(config.hooks);

  let lastError: PluginLastError | null = null;
  if (registered.status === "invalid") {
    const message =
      registered.error instanceof Error
        ? registered.error.message
        : String(registered.error);
    lastError = { message, timestamp: DateTime.utc().toMillis() };
  }

  return {
    name,
    version: config.version,
    status,
    lastError,
    capabilities,
    settings: null,
  };
}

/** BullMQ count keys we surface. Other keys (`prioritized`, `waiting-children`, ...) are ignored. */
const COUNT_KEYS = [
  "waiting",
  "active",
  "completed",
  "failed",
  "delayed",
  "paused",
] as const satisfies readonly (keyof QueueCounts & JobType)[];

async function projectQueue(
  name: string,
  queue: Queue,
): Promise<QueueOverview> {
  // `getJobCounts()` with no args returns all known states; passing the exact
  // 6 we surface keeps the redis round-trip minimal and avoids depending on
  // the bullmq-default set drifting.
  const raw = await queue.getJobCounts(...COUNT_KEYS);
  const counts: QueueCounts = {
    waiting: raw["waiting"] ?? 0,
    active: raw["active"] ?? 0,
    completed: raw["completed"] ?? 0,
    failed: raw["failed"] ?? 0,
    delayed: raw["delayed"] ?? 0,
    paused: raw["paused"] ?? 0,
  };
  return { name, counts };
}

@Resolver()
export class AdminResolver {
  @Query(() => [Plugin], {
    description:
      "Lists every plugin currently held in the runtime registry, regardless of validation status. Reads from the live `RegisteredPluginMap`; if registration hasn't completed the result is an empty array (not stale data).",
  })
  plugins(@AdminContext() admin: AdminContext): Plugin[] {
    return Array.from(admin.plugins.values()).map(projectPlugin);
  }

  @Query(() => [QueueOverview], {
    description:
      "Lists every registered BullMQ queue with its current job-count snapshot. Fans out `getJobCounts` calls in parallel.",
  })
  queues(@AdminContext() admin: AdminContext): Promise<QueueOverview[]> {
    const entries = Array.from(admin.queues.entries());
    return Promise.all(
      entries.map(([name, queue]) => projectQueue(name, queue)),
    );
  }

  @Query(() => QueueJobsPage, {
    description:
      "Paginated job list for a single queue, optionally filtered by lifecycle state. Returns `{ edges: [], total: 0 }` when the named queue is not registered (rather than throwing) so the dashboard can recover gracefully.",
  })
  async jobs(
    @AdminContext() admin: AdminContext,
    @Arg("queue", () => String) queueName: string,
    @Arg("status", () => JobStatus.enum, { nullable: true })
    status: JobStatus | null = null,
    @Arg("limit", () => Int, { defaultValue: DEFAULT_JOBS_LIMIT })
    limit = DEFAULT_JOBS_LIMIT,
    @Arg("offset", () => Int, { defaultValue: 0 })
    offset = 0,
  ): Promise<QueueJobsPage> {
    const queue = admin.queues.get(queueName);
    if (!queue) {
      return { edges: [], total: 0 };
    }

    const clampedLimit = Math.min(
      Math.max(1, Math.trunc(limit)),
      MAX_JOBS_LIMIT,
    );
    const clampedOffset = Math.max(0, Math.trunc(offset));

    // No status filter -> use the four primary buckets the enum exposes; this
    // mirrors what the dashboard's status tabs paginate over.
    const types: JobType[] = status
      ? [status]
      : ["waiting", "active", "completed", "failed"];

    const start = clampedOffset;
    const end = clampedOffset + clampedLimit - 1;

    const [jobs, total] = await Promise.all([
      queue.getJobs(types, start, end, /* asc */ false),
      queue.getJobCountByTypes(...types),
    ]);

    const edges: QueueJobEdge[] = jobs.map((job) => {
      // BullMQ's Job.id is `string | undefined`; we surface `""` for the rare
      // undefined case so the GraphQL `ID` scalar (non-null string) is happy.
      const id = job.id ?? "";
      // BullMQ's `failedReason` is typed as `string` but is only meaningful
      // for failed jobs; coerce empty strings to null so the dashboard can
      // distinguish "no failure" from "empty failure message".
      const failedReason =
        job.failedReason.length > 0 ? job.failedReason : null;
      const data = job.data as Record<string, unknown> | null;
      const node: QueueJob = {
        id,
        name: job.name,
        data,
        attemptsMade: job.attemptsMade,
        failedReason,
        processedOn: job.processedOn ?? null,
        finishedOn: job.finishedOn ?? null,
        timestamp: job.timestamp,
      };
      return { node };
    });

    return { edges, total };
  }
}
