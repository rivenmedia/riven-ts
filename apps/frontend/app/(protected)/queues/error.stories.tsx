import { expect, fn, mocked } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import QueuesError from "./error.tsx";

const meta = preview.meta({
  title: "Pages / Queues / Overview Error",
  component: QueuesError,
  args: { reset: fn() },
});

export const ErrorState = meta.story({ name: "Error" });

ErrorState.test(
  "Explains the failure and retries",
  async ({ canvas, userEvent, args }) => {
    await expect(
      canvas.getByRole("heading", { name: "Couldn't load queues" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText(
        "Couldn't load the queues. Check that Riven and Redis are running, then try again.",
      ),
    ).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Try again" }));

    await expect(mocked(args.reset)).toHaveBeenCalledTimes(1);
  },
);
