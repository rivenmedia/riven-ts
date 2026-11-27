import { CodeBlock } from "../code-block/code-block.tsx";

export interface JobFailureProps {
  reason?: string | undefined;
  stacktrace: readonly string[];
}

/** Why a job failed, with its stack trace. */
export function JobFailure({ reason, stacktrace }: JobFailureProps) {
  return (
    <section
      aria-labelledby="job-failure-heading"
      className="border-destructive/30 bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-5"
    >
      <h2 id="job-failure-heading" className="text-base font-semibold">
        Failure
      </h2>
      {reason ? (
        <p className="text-sm text-red-700 dark:text-red-300">{reason}</p>
      ) : null}
      {stacktrace.length > 0 ? (
        <CodeBlock label="Stack trace">{stacktrace.join("\n")}</CodeBlock>
      ) : null}
    </section>
  );
}
