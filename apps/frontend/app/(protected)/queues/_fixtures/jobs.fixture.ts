import { DateTime } from "luxon";

import { JOB_STATES } from "../_utilities/job-states.ts";
import { queueSummaries } from "./queues.fixture.ts";

import type {
  FlowNode,
  JobDetail,
  JobMediaItem,
  JobSummary,
  QueueSummary,
} from "../_types/job-queue.ts";
import type { JobState } from "../_utilities/job-states.ts";
import type { Route } from "next";

export const FIXTURE_NOW = "2026-11-26T14:02:00.000Z";

const MAX_ATTEMPTS = 3;

/** Distinguishes generated IDs (above this floor) from the hand-written ones. */
const GENERATED_ID_SEED = 150_000;
const STATE_COUNT = JOB_STATES.length;

interface MediaFixture {
  /** The job name, and the title in the media card. */
  name: string;
  title: string;
  subtitle?: string;
  type: "show" | "movie";
  id: number;
}

const toMediaItem = (media: MediaFixture): JobMediaItem => ({
  title: media.title,
  ...(media.subtitle ? { subtitle: media.subtitle } : {}),
  detailsPath: `/details/media/${media.type}/${media.id.toString()}` as Route,
});

const mediaFixtures = {
  severance: {
    name: "Severance S02E07",
    title: "Severance",
    subtitle: "Season 2, episode 7",
    type: "show",
    id: 95_396,
  },
  duneTwo: {
    name: "Dune: Part Two (2024)",
    title: "Dune: Part Two",
    subtitle: "2024",
    type: "movie",
    id: 693_134,
  },
  lastOfUs: {
    name: "The Last of Us S02E03",
    title: "The Last of Us",
    subtitle: "Season 2, episode 3",
    type: "show",
    id: 100_088,
  },
  fallout: {
    name: "Fallout S01E05",
    title: "Fallout",
    subtitle: "Season 1, episode 5",
    type: "show",
    id: 106_379,
  },
  silo: {
    name: "Silo S02E02",
    title: "Silo",
    subtitle: "Season 2, episode 2",
    type: "show",
    id: 125_988,
  },
  paddington: {
    name: "Paddington in Peru (2024)",
    title: "Paddington in Peru",
    subtitle: "2024",
    type: "movie",
    id: 516_729,
  },
  slowHorsesE2: {
    name: "Slow Horses S04E02",
    title: "Slow Horses",
    subtitle: "Season 4, episode 2",
    type: "show",
    id: 95_480,
  },
  arcaneE5: {
    name: "Arcane S02E05",
    title: "Arcane",
    subtitle: "Season 2, episode 5",
    type: "show",
    id: 94_605,
  },
  andorE1: {
    name: "Andor S02E01",
    title: "Andor",
    subtitle: "Season 2, episode 1",
    type: "show",
    id: 83_867,
  },
  bear: {
    name: "The Bear",
    title: "The Bear",
    type: "show",
    id: 136_315,
  },
  shogun: {
    name: "Shōgun S01E09",
    title: "Shōgun",
    subtitle: "Season 1, episode 9",
    type: "show",
    id: 126_308,
  },
  andor: { name: "Andor", title: "Andor", type: "show", id: 83_867 },
  furiosa: {
    name: "Furiosa: A Mad Max Saga (2024)",
    title: "Furiosa: A Mad Max Saga",
    subtitle: "2024",
    type: "movie",
    id: 786_892,
  },
  slowHorses: {
    name: "Slow Horses S04E06",
    title: "Slow Horses",
    subtitle: "Season 4, episode 6",
    type: "show",
    id: 95_480,
  },
  arcane: { name: "Arcane", title: "Arcane", type: "show", id: 94_605 },
} as const satisfies Record<string, MediaFixture>;

/** The titles generated jobs cycle through. */
const generatedMedia: readonly MediaFixture[] = [
  mediaFixtures.severance,
  mediaFixtures.duneTwo,
  mediaFixtures.lastOfUs,
  mediaFixtures.fallout,
  mediaFixtures.silo,
  mediaFixtures.paddington,
  mediaFixtures.slowHorsesE2,
  mediaFixtures.arcaneE5,
  mediaFixtures.andorE1,
  mediaFixtures.shogun,
  mediaFixtures.furiosa,
  mediaFixtures.slowHorses,
];

const generatedFailureReasons = [
  "torrentio: request timed out after 30 s",
  "comet: 429 Too Many Requests",
  "No streams found",
  "No valid torrent after scraping 2 providers",
  "StremThru returned 502 Bad Gateway",
  "No streams passed ranking (0 of 17)",
] as const;

const shiftIso = (iso: string, seconds: number) =>
  DateTime.fromISO(iso, { zone: "utc" }).plus({ seconds }).toISO();

const ago = (seconds: number) => shiftIso(FIXTURE_NOW, -seconds);

const stateIndex = (state: JobState) => JOB_STATES.indexOf(state);

const queueIndex = (queueName: string) =>
  queueSummaries.findIndex((queue) => queue.name === queueName);

/** Generated IDs count down from here, one stride of eight per job. */
export const getQueueIdSeed = (queueName: string) =>
  GENERATED_ID_SEED + Math.max(queueIndex(queueName), 0) * 1000;

export const GENERATED_ID_STRIDE = STATE_COUNT;

const PARENT_QUEUES: Readonly<Record<string, string>> = {
  "process-media-item": "process-item-request",
  "scrape-item": "process-media-item",
  "download-item": "process-media-item",
  "download-item.find-valid-torrent": "download-item",
  "download-item.rank-streams": "download-item",
  "request-stream-link": "process-media-item",
  "request-subtitles": "process-media-item",
  "post-process-media-item": "process-media-item",
  "map-items-to-files": "download-item",
  "parse-scrape-results": "scrape-item",
  "validate-torrent-files": "download-item.find-valid-torrent",
};

const PLUGIN_EVENT_PARENTS: readonly (readonly [string, string])[] = [
  ["media-item.scrape.", "scrape-item"],
  ["media-item.download.success", "post-process-media-item"],
  ["media-item.download.", "download-item"],
  ["media-item.stream-link.", "request-stream-link"],
  ["media-item.subtitle.", "request-subtitles"],
  ["media-item.index.", "process-media-item"],
  ["content-service.", "request-content-services"],
];

const TOP_LEVEL_QUEUES = new Set([
  "process-item-request",
  "request-content-services",
]);

const getParentQueueName = (queue: QueueSummary) => {
  if (TOP_LEVEL_QUEUES.has(queue.name)) {
    return undefined;
  }

  if (queue.kind !== "plugin") {
    return PARENT_QUEUES[queue.name];
  }

  const event = queue.name.slice("riven.".length);

  return PLUGIN_EVENT_PARENTS.find(([prefix]) => event.startsWith(prefix))?.[1];
};

const hasMediaItem = (queue: QueueSummary) =>
  queue.name !== "request-content-services" &&
  !(queue.kind === "plugin" && queue.name.includes("content-service."));

function getAttemptsMade(state: JobState, index: number) {
  switch (state) {
    case "failed": {
      return index % 5 === 4 ? 1 : MAX_ATTEMPTS;
    }
    case "delayed": {
      return index % 2 === 0 ? 1 : 0;
    }
    case "active":
    case "completed": {
      return 1;
    }
    case "waiting":
    case "prioritized":
    case "waiting-children":
    case "paused": {
      return 0;
    }
  }
}

/**
 * The ID of a generated job in the parent queue that exists: a
 * waiting-children job when the queue has any, otherwise a completed one.
 */
function getGeneratedParentId(parentQueueName: string, index: number) {
  const parentQueue = queueSummaries.find(
    (queue) => queue.name === parentQueueName,
  );
  const state: JobState =
    (parentQueue?.counts["waiting-children"] ?? 0) > 0
      ? "waiting-children"
      : "completed";
  const count = Math.max(parentQueue?.counts[state] ?? 1, 1);

  return String(
    getQueueIdSeed(parentQueueName) -
      (index % count) * STATE_COUNT -
      stateIndex(state),
  );
}

const getNonMediaJobName = (queue: QueueSummary) =>
  queue.kind === "plugin"
    ? `${queue.plugin.displayName} content request`
    : "Scheduled content service run";

/** A deterministic job: the same arguments always build the same summary. */
export function generateJobSummary(
  queue: QueueSummary,
  state: JobState,
  index: number,
): JobSummary {
  const seed = getQueueIdSeed(queue.name);
  const id = String(seed - index * STATE_COUNT - stateIndex(state));
  const media = generatedMedia[index % generatedMedia.length];
  const parentQueueName = getParentQueueName(queue);
  const createdAt = ago(60 + index * 37 + stateIndex(state) * 5);
  const processedAt = shiftIso(createdAt, 1 + (index % 3));
  const finishedAt = shiftIso(processedAt, 2 + ((index * 7) % 40));
  const includeMedia = hasMediaItem(queue) && media;

  const name = includeMedia ? media.name : getNonMediaJobName(queue);

  return {
    id,
    name,
    queueName: queue.name,
    state,
    ...(includeMedia ? { mediaItem: toMediaItem(media) } : {}),
    attemptsMade: getAttemptsMade(state, index),
    maxAttempts: MAX_ATTEMPTS,
    createdAt,
    ...(state === "active" || state === "completed" || state === "failed"
      ? { processedAt }
      : {}),
    ...(state === "completed" || state === "failed" ? { finishedAt } : {}),
    ...(state === "delayed"
      ? {
          runAt: shiftIso(FIXTURE_NOW, (index + 1) * 45),
          delayReason: index % 2 === 0 ? "retry-backoff" : "scheduled",
        }
      : {}),
    ...(state === "active" ? { progress: (index * 17 + 23) % 95 } : {}),
    ...(state === "failed"
      ? {
          failedReason:
            generatedFailureReasons[index % generatedFailureReasons.length],
        }
      : {}),
    ...(state === "waiting-children"
      ? { children: { completed: index % 3, total: 3 } }
      : {}),
    ...(parentQueueName
      ? {
          parent: {
            id: getGeneratedParentId(parentQueueName, index),
            queueName: parentQueueName,
          },
        }
      : {}),
  };
}

interface HandWrittenFailedRow {
  id: string;
  media: MediaFixture;
  failedReason: string;
  attemptsMade: number;
  createdAt: string;
  durationSeconds: number;
  parent?: { id: string; queueName: string };
}

const failedJob = (
  queueName: string,
  row: HandWrittenFailedRow,
): JobSummary => {
  const processedAt = shiftIso(row.createdAt, 1);

  return {
    id: row.id,
    name: row.media.name,
    queueName,
    state: "failed",
    mediaItem: toMediaItem(row.media),
    attemptsMade: row.attemptsMade,
    maxAttempts: MAX_ATTEMPTS,
    createdAt: row.createdAt,
    processedAt,
    finishedAt: shiftIso(processedAt, row.durationSeconds),
    failedReason: row.failedReason,
    ...(row.parent ? { parent: row.parent } : {}),
  };
};

const processMediaItemParent = (id: string) => ({
  id,
  queueName: "process-media-item",
});

const scrapeItemFailed: readonly JobSummary[] = [
  {
    id: "48213",
    media: mediaFixtures.severance,
    failedReason: "No streams passed ranking (0 of 41)",
    createdAt: "2026-11-26T13:49:51.000Z",
    durationSeconds: 32.4,
    parent: processMediaItemParent("48190"),
  },
  {
    id: "48207",
    media: mediaFixtures.duneTwo,
    failedReason: "torrentio: request timed out after 30 s",
    createdAt: "2026-11-26T13:47:12.000Z",
    durationSeconds: 31,
    parent: processMediaItemParent("48184"),
  },
  {
    id: "48168",
    media: mediaFixtures.lastOfUs,
    failedReason: "comet: 429 Too Many Requests",
    createdAt: "2026-11-26T13:31:40.000Z",
    durationSeconds: 4,
    parent: processMediaItemParent("48151"),
  },
  {
    id: "48152",
    media: mediaFixtures.fallout,
    failedReason: "No streams found",
    createdAt: "2026-11-26T13:12:05.000Z",
    durationSeconds: 9,
    parent: processMediaItemParent("48139"),
  },
  {
    id: "48101",
    media: mediaFixtures.silo,
    failedReason: "torrentio: request timed out after 30 s",
    createdAt: "2026-11-26T12:44:36.000Z",
    durationSeconds: 31,
    parent: processMediaItemParent("48088"),
  },
  {
    id: "47988",
    media: mediaFixtures.paddington,
    failedReason: "No streams found",
    createdAt: "2026-11-26T11:58:19.000Z",
    durationSeconds: 8,
    parent: processMediaItemParent("47975"),
  },
  {
    id: "47950",
    media: mediaFixtures.slowHorsesE2,
    failedReason: "comet: 429 Too Many Requests",
    createdAt: "2026-11-26T10:21:53.000Z",
    durationSeconds: 5,
    parent: processMediaItemParent("47941"),
  },
  {
    id: "47911",
    media: mediaFixtures.arcaneE5,
    failedReason: "No streams passed ranking (0 of 23)",
    createdAt: "2026-11-25T22:09:27.000Z",
    durationSeconds: 14,
    parent: processMediaItemParent("47902"),
  },
  {
    id: "47802",
    media: mediaFixtures.andorE1,
    failedReason: "torrentio: 503 Service Unavailable",
    createdAt: "2026-11-25T18:36:02.000Z",
    durationSeconds: 6,
    parent: processMediaItemParent("47790"),
  },
].map((row) => failedJob("scrape-item", { ...row, attemptsMade: 3 }));

const itemRequestParent = (id: string) => ({
  id,
  queueName: "process-item-request",
});

const processMediaItemFailed: readonly JobSummary[] = [
  failedJob("process-media-item", {
    id: "49012",
    media: mediaFixtures.bear,
    failedReason: "3 of 10 episodes failed to download",
    attemptsMade: 3,
    createdAt: "2026-11-26T13:41:08.000Z",
    durationSeconds: 184,
  }),
  failedJob("process-media-item", {
    id: "48998",
    media: mediaFixtures.duneTwo,
    failedReason: "No valid torrent after scraping 2 providers",
    attemptsMade: 3,
    createdAt: "2026-11-26T13:22:41.000Z",
    durationSeconds: 96,
    parent: itemRequestParent("48960"),
  }),
  failedJob("process-media-item", {
    id: "48871",
    media: mediaFixtures.shogun,
    failedReason: "No streams passed ranking (0 of 17)",
    attemptsMade: 3,
    createdAt: "2026-11-26T12:05:30.000Z",
    durationSeconds: 71,
    parent: itemRequestParent("48850"),
  }),
  failedJob("process-media-item", {
    id: "48702",
    media: mediaFixtures.andor,
    failedReason: "Item is in the wrong state for processing: completed",
    attemptsMade: 1,
    createdAt: "2026-11-26T09:48:12.000Z",
    durationSeconds: 1,
  }),
  failedJob("process-media-item", {
    id: "48655",
    media: mediaFixtures.furiosa,
    failedReason: "StremThru returned 502 Bad Gateway",
    attemptsMade: 3,
    createdAt: "2026-11-26T08:30:44.000Z",
    durationSeconds: 128,
  }),
  failedJob("process-media-item", {
    id: "48511",
    media: mediaFixtures.slowHorses,
    failedReason: "No valid torrent after scraping 2 providers",
    attemptsMade: 3,
    createdAt: "2026-11-25T23:12:09.000Z",
    durationSeconds: 88,
    parent: itemRequestParent("48490"),
  }),
  failedJob("process-media-item", {
    id: "48302",
    media: mediaFixtures.arcane,
    failedReason: "2 of 9 episodes failed to download",
    attemptsMade: 3,
    createdAt: "2026-11-25T19:40:55.000Z",
    durationSeconds: 203,
  }),
];

/** The failed jobs that are written by hand, in display order. */
export const handWrittenFailedJobs: Readonly<
  Record<string, readonly JobSummary[]>
> = {
  "scrape-item": scrapeItemFailed,
  "process-media-item": processMediaItemFailed,
};

const job48213Flow: FlowNode = {
  id: "48177",
  queueName: "process-item-request",
  state: "completed",
  children: [
    {
      id: "48190",
      queueName: "process-media-item",
      state: "waiting-children",
      children: [
        {
          id: "48213",
          queueName: "scrape-item",
          state: "failed",
          children: [
            {
              id: "48214",
              queueName: "riven.media-item.scrape.requested.plugin[torrentio]",
              state: "failed",
              failureIgnoredByParent: true,
              children: [],
            },
            {
              id: "48215",
              queueName: "riven.media-item.scrape.requested.plugin[comet]",
              state: "completed",
              children: [],
            },
            {
              id: "48216",
              queueName: "parse-scrape-results",
              state: "completed",
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

const supportJob = (
  queueName: string,
  id: string,
  state: JobState,
  media: MediaFixture,
  createdAt: string,
  parent?: { id: string; queueName: string },
): JobSummary => ({
  id,
  name: media.name,
  queueName,
  state,
  mediaItem: toMediaItem(media),
  attemptsMade: state === "waiting-children" ? 0 : 1,
  maxAttempts: MAX_ATTEMPTS,
  createdAt,
  processedAt: shiftIso(createdAt, 1),
  ...(state === "completed" ? { finishedAt: shiftIso(createdAt, 60) } : {}),
  ...(state === "waiting-children"
    ? { children: { completed: 1, total: 2 } }
    : {}),
  ...(parent ? { parent } : {}),
});

const scrapeParentIds = [
  ["48190", mediaFixtures.severance, "2026-11-26T13:49:50.000Z"],
  ["48184", mediaFixtures.duneTwo, "2026-11-26T13:47:10.000Z"],
  ["48151", mediaFixtures.lastOfUs, "2026-11-26T13:31:38.000Z"],
  ["48139", mediaFixtures.fallout, "2026-11-26T13:12:03.000Z"],
  ["48088", mediaFixtures.silo, "2026-11-26T12:44:34.000Z"],
  ["47975", mediaFixtures.paddington, "2026-11-26T11:58:17.000Z"],
  ["47941", mediaFixtures.slowHorsesE2, "2026-11-26T10:21:51.000Z"],
  ["47902", mediaFixtures.arcaneE5, "2026-11-25T22:09:25.000Z"],
  ["47790", mediaFixtures.andorE1, "2026-11-25T18:36:00.000Z"],
] as const;

/**
 * Jobs that other fixtures point at (parents and flow nodes). They are found
 * by ID but never listed, so the queue counts stay as written.
 */
export const handWrittenLinkedJobs: readonly JobSummary[] = [
  supportJob(
    "process-item-request",
    "48177",
    "completed",
    mediaFixtures.severance,
    "2026-11-26T13:49:40.000Z",
  ),
  ...scrapeParentIds.map(([id, media, createdAt]) =>
    supportJob(
      "process-media-item",
      id,
      "waiting-children",
      media,
      createdAt,
      id === "48190"
        ? { id: "48177", queueName: "process-item-request" }
        : undefined,
    ),
  ),
  supportJob(
    "process-item-request",
    "48960",
    "completed",
    mediaFixtures.duneTwo,
    "2026-11-26T13:22:30.000Z",
  ),
  supportJob(
    "process-item-request",
    "48850",
    "completed",
    mediaFixtures.shogun,
    "2026-11-26T12:05:20.000Z",
  ),
  supportJob(
    "process-item-request",
    "48490",
    "completed",
    mediaFixtures.slowHorses,
    "2026-11-25T23:12:00.000Z",
  ),
  {
    ...supportJob(
      "riven.media-item.scrape.requested.plugin[torrentio]",
      "48214",
      "failed",
      mediaFixtures.severance,
      "2026-11-26T13:49:52.000Z",
      { id: "48213", queueName: "scrape-item" },
    ),
    attemptsMade: 3,
    finishedAt: "2026-11-26T13:50:21.000Z",
    failedReason: "request timed out after 30 s",
  },
  supportJob(
    "riven.media-item.scrape.requested.plugin[comet]",
    "48215",
    "completed",
    mediaFixtures.severance,
    "2026-11-26T13:49:52.000Z",
    { id: "48213", queueName: "scrape-item" },
  ),
  supportJob(
    "parse-scrape-results",
    "48216",
    "completed",
    mediaFixtures.severance,
    "2026-11-26T13:50:22.000Z",
    { id: "48213", queueName: "scrape-item" },
  ),
];

const isFlowNode = (node: FlowNode, queueName: string, id: string): boolean =>
  (node.id === id && node.queueName === queueName) ||
  node.children.some((child) => isFlowNode(child, queueName, id));

const job48213Detail = (summary: JobSummary): JobDetail => ({
  ...summary,
  stacktrace: [
    "Error: No streams passed ranking (0 of 41)",
    "    at scrapeItemProcessor (lib/message-queue/flows/process-media-item/steps/scrape/scrape-item.processor.ts:112:13)",
    "    at async Worker.processJob (node_modules/bullmq/dist/esm/classes/worker.js:543:28)",
    "    at async Worker.retryIfFailed (node_modules/bullmq/dist/esm/classes/worker.js:767:24)",
  ],
  logs: [
    "13:49:52  Scraping Severance S02E07 with 2 plugins",
    "13:50:21  torrentio failed: request timed out after 30 s",
    "13:50:22  comet returned 41 streams",
    "13:50:24  0 of 41 streams passed ranking",
    "          resolution below 1080p: 29, excluded language: 8, over size limit: 4",
  ],
  data: {
    step: "scrape",
    isRootItem: false,
    mediaItem: {
      id: 5521,
      type: "episode",
      fullTitle: "Severance S02E07",
    },
  },
  flow: job48213Flow,
});

function buildGenericJobDetail(summary: JobSummary): JobDetail {
  const title = summary.mediaItem?.subtitle
    ? `${summary.mediaItem.title} (${summary.mediaItem.subtitle})`
    : (summary.mediaItem?.title ?? summary.name);

  return {
    ...summary,
    stacktrace: summary.failedReason
      ? [
          `Error: ${summary.failedReason}`,
          `    at ${summary.queueName} (/app/apps/riven/lib/workflows/${summary.queueName}.processor.ts:84:15)`,
          "    at async Worker.processJob (/app/node_modules/bullmq/dist/cjs/classes/worker.js:610:28)",
        ]
      : [],
    logs: [
      `Starting ${summary.queueName} for ${title}`,
      ...(summary.state === "failed" && summary.failedReason
        ? [summary.failedReason]
        : []),
    ],
    data: {
      step: summary.queueName,
      isRootItem: !summary.parent,
      ...(summary.mediaItem ? { mediaItem: { fullTitle: summary.name } } : {}),
    },
    ...(summary.state === "completed"
      ? { returnValue: { success: true } }
      : {}),
    flow: {
      id: summary.id,
      queueName: summary.queueName,
      state: summary.state,
      children: [],
    },
  };
}

/** Builds a detail for any summary the stub data source can return. */
export function buildJobDetail(summary: JobSummary): JobDetail {
  if (summary.queueName === "scrape-item" && summary.id === "48213") {
    return job48213Detail(summary);
  }

  if (isFlowNode(job48213Flow, summary.queueName, summary.id)) {
    return { ...buildGenericJobDetail(summary), flow: job48213Flow };
  }

  return buildGenericJobDetail(summary);
}
