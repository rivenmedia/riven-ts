import type { LogLevel } from "@/app/_types/__generated__/graphql";

export interface LogEntryRowProps {
  log: {
    timestamp?: string | null;
    level: Lowercase<LogLevel>;
    message?: string | null;
    source?: string | null;
  };
}

export function LogEntryRow({ log }: LogEntryRowProps) {
  const levelColors: Partial<Record<Lowercase<LogLevel>, string>> = {
    error: "text-red-400",
    warn: "text-yellow-400",
    info: "text-green-400",
    debug: "text-blue-400",
  };

  const level = log.level.toLowerCase() as Lowercase<LogLevel>;
  const levelClassName = levelColors[level] ?? "text-foreground";

  return (
    <div className="border-border/50 hover:bg-muted/20 border-b transition-colors last:border-b-0">
      <div className="text-foreground/90 grid grid-cols-[auto_auto_auto_1fr] gap-x-3 p-2 font-mono text-xs">
        <span className="text-muted-foreground shrink-0">
          {log.timestamp ?? ""}
        </span>
        <span className={`shrink-0 font-semibold uppercase ${levelClassName}`}>
          {level}
        </span>
        <span className="text-muted-foreground/70 shrink-0">
          {log.source ?? ""}
        </span>
        <span className="wrap-break-word whitespace-pre-wrap">
          {log.message ?? ""}
        </span>
      </div>
    </div>
  );
}
