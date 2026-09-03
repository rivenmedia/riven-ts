export interface LiveLogLineProps {
  line: string;
}

export function LiveLogLine({ line }: LiveLogLineProps) {
  return (
    <div className="border-border/50 hover:bg-muted/20 border-b transition-colors last:border-b-0">
      <div className="text-foreground/90 p-2 font-mono text-xs wrap-break-word whitespace-pre-wrap">
        {line}
      </div>
    </div>
  );
}
