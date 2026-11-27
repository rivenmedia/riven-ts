import { preview } from "#.storybook/preview.tsx";

import { JOB_STATES } from "../../_utilities/job-states.ts";
import { JobStateDot } from "./job-state-dot.tsx";

const meta = preview.meta({
  title: "Pages / Queues / Components / JobStateDot",
  component: JobStateDot,
  args: { state: "active" },
});

export const Default = meta.story();

export const AllStates = meta.story({
  render: () => (
    <div className="flex gap-3">
      {JOB_STATES.map((state) => (
        <JobStateDot key={state} state={state} />
      ))}
    </div>
  ),
});
