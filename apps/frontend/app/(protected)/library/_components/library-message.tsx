import type { LucideIcon } from "lucide-react";
import type { JSX } from "react";

interface LibraryMessageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  button: JSX.Element;
}

export function LibraryMessage({
  icon: Icon,
  title,
  description,
  button,
}: LibraryMessageProps) {
  return (
    <>
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/5 bg-zinc-900/50">
        <Icon className="h-10 w-10 text-zinc-600" />
      </div>
      <div>
        <h3 className="text-xl font-medium text-white">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-zinc-500 whitespace-pre-line">
          {description}
        </p>
      </div>
      {button}
    </>
  );
}
