export interface ConfirmCopy {
  title: string;
  description: string;
  confirmLabel: string;
}

/** "1 job" or "2 jobs". */
export function jobCountLabel(count: number) {
  return `${count.toString()} ${count === 1 ? "job" : "jobs"}`;
}

/** Up to three jobs are named; more are only counted. */
function describeJobs(jobIds: readonly string[]) {
  if (jobIds.length > 3) {
    return jobCountLabel(jobIds.length);
  }

  const names = jobIds.map((id) => `#${id}`);
  const last = names.at(-1);

  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${last ?? ""}`
    : (last ?? "");
}

export function removeConfirmCopy(
  jobIds: readonly string[],
  queueLabel: string,
): ConfirmCopy {
  const count = jobCountLabel(jobIds.length);

  return {
    title: `Remove ${count}?`,
    description: `This deletes ${describeJobs(jobIds)} from ${queueLabel}. Their media items stay in your library. You can't undo this.`,
    confirmLabel: `Remove ${count}`,
  };
}

export function cleanConfirmCopy(
  state: "completed" | "failed",
  count: number,
  queueLabel: string,
): ConfirmCopy {
  return {
    title: `Clean ${count.toString()} ${state} jobs?`,
    description: `This deletes every ${state} job in ${queueLabel}. You can't undo this.`,
    confirmLabel: `Clean ${count.toString()} jobs`,
  };
}

export function pauseConfirmCopy(queueLabel: string): ConfirmCopy {
  return {
    title: `Pause ${queueLabel}?`,
    description:
      "Jobs already running finish. New jobs wait here until you resume it. Flows waiting on this queue will stall until you resume it.",
    confirmLabel: "Pause queue",
  };
}
