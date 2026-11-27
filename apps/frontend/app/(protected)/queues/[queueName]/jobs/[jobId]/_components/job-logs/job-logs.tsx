import { CodeBlock } from "../code-block/code-block.tsx";

export interface JobLogsProps {
  lines: readonly string[];
}

/** A job's log lines, with their count. */
export function JobLogs({ lines }: JobLogsProps) {
  return (
    <section
      aria-labelledby="job-logs-heading"
      className="bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="job-logs-heading" className="text-base font-semibold">
          Logs
        </h2>
        <span className="text-muted-foreground text-xs">
          {lines.length} {lines.length === 1 ? "line" : "lines"}
        </span>
      </div>
      {lines.length > 0 ? (
        <CodeBlock label="Log lines">{lines.join("\n")}</CodeBlock>
      ) : (
        <p className="text-muted-foreground text-sm">
          This job hasn&apos;t logged anything.
        </p>
      )}
    </section>
  );
}
