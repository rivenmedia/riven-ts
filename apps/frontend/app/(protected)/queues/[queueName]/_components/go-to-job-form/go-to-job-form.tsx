"use client";

import { useState } from "react";

import { Button } from "#components/_ui/button.tsx";
import { Input } from "#components/_ui/input.tsx";
import { Label } from "#components/_ui/label.tsx";

import { jobHref } from "../../../_utilities/queue-routes.ts";

import type { SubmitEvent } from "react";

export interface GoToJobFormProps {
  queueName: string;
}

/** Opens a job ID from this queue in a new tab. */
export function GoToJobForm({ queueName }: GoToJobFormProps) {
  const [value, setValue] = useState("");
  const jobId = value.trim();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (jobId) {
      globalThis.open(jobHref(queueName, jobId), "_blank", "noopener");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Label htmlFor="go-to-job" className="whitespace-nowrap">
        Go to job
      </Label>
      <Input
        id="go-to-job"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        placeholder="Job ID"
        autoComplete="off"
        className="w-32 font-mono"
      />
      <Button type="submit" variant="outline" disabled={!jobId}>
        Open
      </Button>
    </form>
  );
}
