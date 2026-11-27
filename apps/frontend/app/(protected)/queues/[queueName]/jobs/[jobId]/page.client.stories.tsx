import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, spyOn, waitFor, within } from "storybook/test";
import { INITIAL_VIEWPORTS } from "storybook/viewport";

import { preview } from "#.storybook/preview.tsx";

import {
  getJob,
  getJobs,
  getLiveStatus,
  getQueue,
} from "../../../_data/queue-data.ts";
import { FIXTURE_NOW } from "../../../_fixtures/jobs.fixture.ts";
import { jobHref } from "../../../_utilities/queue-routes.ts";
import { JobPage } from "./page.client.tsx";

const props = (queueName: string, jobId: string) => {
  const queue = getQueue(queueName);
  const job = getJob(queueName, jobId);

  if (!queue || !job) {
    throw new Error(`Unknown fixture job ${queueName} #${jobId}`);
  }

  return { queue, job };
};

const activeJobId = getJobs("process-item-request", "active", 1).jobs[0]?.id;

if (!activeJobId) {
  throw new Error("Missing a generated active job");
}

const disconnected = {
  ...getLiveStatus(),
  connectionStatus: "disconnected",
  reconnectAttempts: 3,
} as const;

const expectToast = async (root: HTMLElement, text: string) => {
  const toasts = within(
    within(root).getByRole("region", { name: /notifications/iu }),
  );

  await waitFor(async () => {
    await expect(toasts.getByText(text)).toBeVisible();
  });
};

const meta = preview.meta({
  title: "Pages / Queues / Job",
  component: JobPage,
  args: {
    ...props("scrape-item", "48213"),
    liveStatus: getLiveStatus(),
    now: FIXTURE_NOW,
    locale: "en-GB",
  },
  parameters: { layout: "fullscreen" },
});

export const ChildJob = meta.story();

ChildJob.test("Shows the job and its state", async ({ canvas }) => {
  const heading = canvas.getByRole("heading", { name: "Job #48213", level: 1 });

  expect.assert(heading.parentElement);
  await expect(heading).toBeVisible();
  await expect(within(heading.parentElement).getByText("Failed")).toBeVisible();
  await expect(
    canvas.getByRole("link", { name: "Scrape item" }),
  ).toHaveAttribute("href", "/queues/scrape-item");
});

ChildJob.test(
  "Names the media item and queue in the subtitle",
  async ({ canvas }) => {
    await expect(
      canvas.getByText("Severance", { selector: "p" }),
    ).toHaveTextContent("Severance in scrape-item");
  },
);

ChildJob.test("Summarises the job", async ({ canvas }) => {
  const summary = within(canvas.getByRole("region", { name: "Summary" }));

  await expect(summary.getByText("Severance S02E07")).toBeVisible();
  await expect(summary.getByText("3 of 3")).toBeVisible();
  await expect(summary.getByText("32.4 s")).toBeVisible();
  await expect(
    summary.getByRole("link", { name: "process-media-item #48190" }),
  ).toHaveAttribute("href", jobHref("process-media-item", "48190"));
  await expect(summary.queryByText("Progress")).toBeNull();
});

ChildJob.test("Sends actions to the top-level job", async ({ canvas }) => {
  await expect(
    canvas.getByText("Part of a flow. Act on its top-level job instead."),
  ).toBeVisible();
  await expect(
    within(canvas.getByRole("note")).getByRole("link", {
      name: "process-item-request #48177",
    }),
  ).toHaveAttribute("href", jobHref("process-item-request", "48177"));
  await expect(canvas.queryByRole("button", { name: "Retry" })).toBeNull();
  await expect(canvas.queryByRole("button", { name: "Remove" })).toBeNull();
});

ChildJob.test("Shows the failure, logs and flow", async ({ canvas }) => {
  await expect(
    canvas.getAllByText("No streams passed ranking (0 of 41)").length,
  ).toBeGreaterThan(0);
  await expect(canvas.getByText("5 lines")).toBeVisible();
  await expect(canvas.getByText(/"step": "scrape"/u)).toBeVisible();
  await expect(canvas.getByText("Media item")).toBeVisible();
});

ChildJob.test(
  "Copies the link",
  async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Copy link" }));

    await expectToast(canvasElement, "Link copied");
  },
);

ChildJob.test(
  "Says when the link can't be copied",
  async ({ canvas, canvasElement, userEvent }) => {
    const writeText = spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );

    await userEvent.click(canvas.getByRole("button", { name: "Copy link" }));

    await expectToast(canvasElement, "Couldn't copy the link");

    writeText.mockRestore();
  },
);

export const TopLevelFailedJob = meta.story({
  args: props("process-media-item", "49012"),
});

TopLevelFailedJob.test("Offers Retry and Remove", async ({ canvas }) => {
  await expect(canvas.getByRole("button", { name: "Retry" })).toBeEnabled();
  await expect(canvas.getByRole("button", { name: "Remove" })).toBeEnabled();
  await expect(canvas.queryByRole("note")).toBeNull();
  await expect(canvas.queryByText("Parent job")).toBeNull();
});

TopLevelFailedJob.test(
  "Retries without asking",
  async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));

    await expect(canvas.queryByRole("alertdialog")).toBeNull();
    await expectToast(canvasElement, "Retried 1 job");
  },
);

TopLevelFailedJob.test(
  "Removes the job after confirming, then leaves the page",
  async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "Remove" }));

    await waitFor(async () => {
      await expect(
        body.getByRole("alertdialog", { name: "Remove 1 job?" }),
      ).toBeVisible();
    });

    await userEvent.click(body.getByRole("button", { name: "Remove 1 job" }));

    await expectToast(canvasElement, "Removed 1 job");
    await expect(getRouter().push).toHaveBeenCalledWith(
      "/queues/process-media-item",
    );
  },
);

export const ActiveJob = meta.story({
  args: props("process-item-request", activeJobId),
});

ActiveJob.test("Has no actions and no failure", async ({ canvas }) => {
  await expect(canvas.queryByRole("button", { name: "Retry" })).toBeNull();
  await expect(canvas.queryByRole("button", { name: "Remove" })).toBeNull();
  await expect(canvas.queryByRole("region", { name: "Failure" })).toBeNull();
  await expect(
    within(canvas.getByRole("region", { name: "Summary" })).getByText(
      "Progress",
    ),
  ).toBeVisible();
});

export const Disconnected = meta.story({
  args: { ...props("process-media-item", "49012"), liveStatus: disconnected },
});

Disconnected.test("Turns actions off", async ({ canvas }) => {
  await expect(canvas.getByText(/^Showing data from/u)).toBeVisible();

  for (const name of ["Retry", "Remove", "Copy link"]) {
    await expect(canvas.getByRole("button", { name })).toBeDisabled();
  }
});

export const Mobile = meta.story({
  parameters: { viewport: { options: INITIAL_VIEWPORTS } },
  globals: { viewport: { value: "mobile1", isRotated: false } },
});
