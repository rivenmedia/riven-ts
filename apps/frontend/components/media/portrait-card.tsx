import { cn } from "@/lib/utils";

import { Check, Mountain } from "lucide-react";
import Image from "next/image";

interface PortraitCardProps extends Pick<
  React.HTMLAttributes<HTMLDivElement>,
  "className"
> {
  title: string;
  subtitle?: string | null;
  image: string | null;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectToggle?: () => void;
  topRight?: React.ReactNode;
  showContent?: boolean;
}

export function PortraitCard({
  image,
  title,
  className,
  isSelectable = false,
  isSelected = false,
  onSelectToggle,
  showContent = true,
  subtitle,
  topRight,
}: PortraitCardProps) {
  function renderDefaultImage() {
    return (
      <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
        <Mountain size={32} strokeWidth={1} />
      </div>
    );
  }

  function renderImage(src: string) {
    return (
      <>
        <Image
          alt={title}
          src={src}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-110",
            isSelected ? "scale-105 opacity-40 grayscale-[0.5]" : "opacity-100",
          )}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100"></div>
        <div className="from-primary/20 absolute inset-0 bg-linear-to-t via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
      </>
    );
  }

  function renderSelectButton() {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelectToggle?.();
        }}
        className={cn(
          "absolute top-3 left-3 z-30 flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200",
          isSelected
            ? "border-primary bg-primary text-primary-foreground scale-110"
            : "border-white/30 bg-black/20 opacity-0 group-hover:opacity-100 hover:border-white/50 hover:bg-black/40",
        )}
        aria-label="Select item"
      >
        {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>
    );
  }

  function renderTopRightSlot() {
    return (
      <div className="absolute top-3 right-3 z-20 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
        {topRight}
      </div>
    );
  }

  function renderContent() {
    return (
      <div className="absolute inset-x-0 bottom-0 z-20 p-4 transition-transform duration-300 group-hover:-translate-y-1">
        <h3 className="line-clamp-2 leading-tight font-bold text-balance text-white drop-shadow-md">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-1 line-clamp-1 text-xs font-medium text-zinc-300/90">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group bg-card ring-border hover:ring-primary/30 relative aspect-2/3 w-full overflow-hidden rounded-xl shadow-sm ring-1 transition-all duration-500 hover:shadow-2xl hover:shadow-black/50",
        isSelected &&
          "ring-primary shadow-[0_0_30px_rgba(var(--primary),0.3)] ring-2",
        className,
      )}
    >
      {image ? renderImage(image) : renderDefaultImage()}
      {isSelectable && renderSelectButton()}
      {topRight && renderTopRightSlot()}
      {showContent && renderContent()}
    </div>
  );
}
