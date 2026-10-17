export interface SectionHeadingProps {
  title: string;
}

export function SectionHeading({ title }: SectionHeadingProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="bg-primary h-6 w-1 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
      <h2 className="text-foreground text-xl font-bold tracking-tight drop-shadow-md">
        {title}
      </h2>
    </div>
  );
}
