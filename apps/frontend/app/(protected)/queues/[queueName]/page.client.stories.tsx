import { useState } from "react";
import { expect, waitFor, within } from "storybook/test";
import { INITIAL_VIEWPORTS } from "storybook/viewport";

import { preview } from "#.storybook/preview.tsx";

import { getJobs, getLiveStatus, getQueue } from "../_data/queue-data.ts";
import { FIXTURE_NOW } from "../_fixtures/jobs.fixture.ts";
import { QueuePage } from "./page.client.tsx";

import type { JobState } from "../_utilities/job-states.ts";
import type { QueuePageProps } from "./page.client.tsx";

const props = (queueName: string, state: JobState) => {
  const queue = getQueue(queueName);

  if (!queue) {
    throw new Error(`Unknown fixture queue ${queueName}`);
  }

  return {
    queue,
    state,
    jobPage: getJobs(queueName, state, 1),
  };
};

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
  component: QueuePage,
  args: {
    ...props("process-media-item", "failed"),
    liveStatus: getLiveStatus(),
    now: FIXTURE_NOW,
    locale: "en-GB",
  },
});

export const Failed = meta.story();

Failed.test("shows the queue and its failed jobs", async ({ canvas }) => {
  await expect(
    canvas.getByRole("heading", { name: "Process media item", level: 1 }),
  ).toBeVisible();
  await expect(canvas.getByText("process-media-item · flow")).toBeVisible();
  await expect(canvas.getByRole("link", { name: "Failed 7" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(
    canvas.getByRole("checkbox", { name: "Select job 49012" }),
  ).toBeVisible();
  await expect(canvas.getByText("Showing 1–7 of 7")).toBeVisible();
});

Failed.test("selects jobs", async ({ canvas, userEvent }) => {
  await userEvent.click(
    canvas.getByRole("checkbox", { name: "Select job 49012" }),
  );

  await expect(
    canvas.getByRole("checkbox", { name: "Select job 49012" }),
  ).toBeChecked();
  await expect(
    canvas.getByRole("checkbox", {
      name: "Select all 4 top-level jobs on this page",
    }),
  ).toHaveAttribute("aria-checked", "mixed");
});

export const ChildJobsFailed = meta.story({
  args: props("scrape-item", "failed"),
});

ChildJobsFailed.test("has nothing to select", async ({ canvas }) => {
  await expect(
    canvas.getByRole("heading", { name: "Scrape item", level: 1 }),
  ).toBeVisible();
  await expect(canvas.queryAllByRole("checkbox")).toHaveLength(0);
});

export const PluginQueue = meta.story({
  args: props("riven.media-item.scrape.requested.plugin[torrentio]", "waiting"),
});

PluginQueue.test("uses the plugin queue's display name", async ({ canvas }) => {
  await expect(
    canvas.getByRole("heading", { name: "Scrape requested", level: 1 }),
  ).toBeVisible();
});

export const PausedQueue = meta.story({
  args: props("request-subtitles", "paused"),
});

PausedQueue.test("says the queue is paused", async ({ canvas }) => {
  await expect(canvas.getByText("Request subtitles is paused")).toBeVisible();
  await expect(
    canvas.getAllByRole("button", { name: "Resume queue" }),
  ).toHaveLength(2);
});

PausedQueue.test(
  "resumes without asking",
  async ({ canvas, canvasElement, userEvent }) => {
    const [headerButton] = canvas.getAllByRole("button", {
      name: "Resume queue",
    });

    expect.assert(headerButton);
    await userEvent.click(headerButton);

    await expect(canvas.queryByRole("alertdialog")).not.toBeInTheDocument();
    await expectToast(canvasElement, "Resumed Request subtitles");
  },
);

PausedQueue.test(
  "resumes from the banner",
  async ({ canvas, canvasElement, userEvent }) => {
    const banner = canvas.getByText("Request subtitles is paused").parentElement
      ?.parentElement;

    expect.assert(banner);
    await userEvent.click(
      within(banner).getByRole("button", { name: "Resume queue" }),
    );

    await expectToast(canvasElement, "Resumed Request subtitles");
  },
);

export const DisconnectedPaused = meta.story({
  args: {
    ...props("request-subtitles", "paused"),
    liveStatus: disconnected,
  },
});

DisconnectedPaused.test("turns resume off", async ({ canvas }) => {
  await expect(canvas.getByText(/^Showing data from/u)).toBeVisible();

  for (const button of canvas.getAllByRole("button", {
    name: "Resume queue",
  })) {
    await expect(button).toBeDisabled();
  }
});

export const Disconnected = meta.story({
  args: {
    ...props("process-media-item", "failed"),
    liveStatus: disconnected,
    initialSelectedIds: ["49012", "48702"],
  },
});

Disconnected.test("turns actions off", async ({ canvas }) => {
  await expect(canvas.getByText(/^Showing data from/u)).toBeVisible();

  for (const name of ["Retry", "Remove", "Pause queue", "Clean"]) {
    await expect(canvas.getByRole("button", { name })).toBeDisabled();
  }
});

export const Mobile = meta.story({
  parameters: { viewport: { options: INITIAL_VIEWPORTS } },
  globals: { viewport: { value: "mobile1", isRotated: false } },
});

Failed.test(
  "retries the selected jobs",
  async ({ canvas, canvasElement, userEvent }) => {
    for (const id of ["49012", "48702"]) {
      await userEvent.click(
        canvas.getByRole("checkbox", { name: `Select job ${id}` }),
      );
    }
    await expect(
      canvas.getByText("Selected").previousElementSibling,
    ).toHaveTextContent("2");

    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));

    await expectToast(canvasElement, "Retried 2 jobs");
  },
);

Failed.test(
  "removes the selected jobs after confirming",
  async ({ canvas, canvasElement, userEvent }) => {
    const body = within(
      canvas.getByRole("heading", { level: 1 }).ownerDocument.body,
    );

    for (const id of ["49012", "48702"]) {
      await userEvent.click(
        canvas.getByRole("checkbox", { name: `Select job ${id}` }),
      );
    }
    await userEvent.click(canvas.getByRole("button", { name: "Remove" }));

    await waitFor(async () => {
      await expect(
        body.getByRole("alertdialog", { name: "Remove 2 jobs?" }),
      ).toBeVisible();
    });

    await userEvent.click(body.getByRole("button", { name: "Remove 2 jobs" }));

    await expectToast(canvasElement, "Removed 2 jobs");
    await expect(
      canvas.queryByRole("button", { name: "Clear selection" }),
    ).not.toBeInTheDocument();
  },
);

Failed.test(
  "selecting all skips child jobs",
  async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("checkbox", {
        name: "Select all 4 top-level jobs on this page",
      }),
    );

    await expect(
      canvas.getByText("Selected").previousElementSibling,
    ).toHaveTextContent("4");

    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));

    await expectToast(canvasElement, "Retried 4 jobs");
  },
);

Failed.test(
  "cleans failed jobs after confirming",
  async ({ canvas, canvasElement, userEvent }) => {
    const body = within(
      canvas.getByRole("heading", { level: 1 }).ownerDocument.body,
    );

    await userEvent.click(canvas.getByRole("button", { name: "Clean" }));
    await userEvent.click(
      await body.findByRole("menuitem", { name: "Clean failed jobs" }),
    );

    await waitFor(async () => {
      await expect(
        body.getByRole("alertdialog", { name: "Clean 7 failed jobs?" }),
      ).toBeVisible();
    });

    await userEvent.click(body.getByRole("button", { name: "Clean 7 jobs" }));

    await expectToast(canvasElement, "Cleaned 7 failed jobs");
  },
);

Failed.test(
  "pauses the queue after confirming",
  async ({ canvas, canvasElement, userEvent }) => {
    const body = within(
      canvas.getByRole("heading", { level: 1 }).ownerDocument.body,
    );

    await userEvent.click(canvas.getByRole("button", { name: "Pause queue" }));

    await waitFor(async () => {
      await expect(
        body.getByRole("alertdialog", {
          name: "Pause Process media item?",
        }),
      ).toBeVisible();
    });

    await userEvent.click(body.getByRole("button", { name: "Pause queue" }));

    await expectToast(canvasElement, "Paused Process media item");
  },
);

export const Waiting = meta.story({
  args: props("process-item-request", "waiting"),
});

Waiting.test("offers Remove but not Retry", async ({ canvas, userEvent }) => {
  const [firstJob] = canvas.getAllByRole("checkbox", { name: /^Select job /u });

  expect.assert(firstJob);
  await userEvent.click(firstJob);

  await expect(canvas.getByRole("button", { name: "Remove" })).toBeVisible();
  await expect(
    canvas.queryByRole("button", { name: "Retry" }),
  ).not.toBeInTheDocument();
});

const SelectionResetHarness = (args: QueuePageProps) => {
  const [view, setView] = useState({
    state: "failed" as JobState,
    jobPage: getJobs("process-media-item", "failed", 1),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setView({
            state: "completed",
            jobPage: getJobs("process-media-item", "completed", 1),
          });
        }}
      >
        Switch to Completed
      </button>
      <QueuePage {...args} state={view.state} jobPage={view.jobPage} />
    </>
  );
};

export const SelectionReset = meta.story({
  render: (args) => <SelectionResetHarness {...args} />,
});

SelectionReset.test(
  "clears the selection when the tab changes",
  async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Select job 49012" }),
    );
    await expect(canvas.getByText("Selected")).toBeVisible();

    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Completed" }),
    );

    await expect(canvas.queryByText("Selected")).not.toBeInTheDocument();

    for (const checkbox of canvas.queryAllByRole("checkbox")) {
      await expect(checkbox).not.toBeChecked();
    }
  },
);
