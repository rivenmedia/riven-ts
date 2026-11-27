import { expect, fn } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import JobError from "./error.tsx";

const meta = preview.meta({
  title: "Pages / Queues / Job Error",
  component: JobError,
  args: { reset: fn() },
});

export const ErrorState = meta.story({ name: "Error" });

ErrorState.test(
  "Explains the failure and retries",
  async ({ canvas, userEvent, args }) => {
    await expect(
      canvas.getByRole("heading", { name: "Couldn't load this job" }),
    ).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Try again" }));

    await expect(args.reset).toHaveBeenCalledTimes(1);
  },
);
