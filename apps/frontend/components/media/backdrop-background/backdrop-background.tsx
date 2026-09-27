import type { ReactElement } from "react";

export interface BackdropBackgroundProps {
  tone?: "zinc" | "background";
  image: ReactElement;
}

export function BackdropBackground({
  tone = "zinc",
  image,
}: BackdropBackgroundProps) {
  return (
    <div className="fixed top-0 left-0 z-0 h-screen w-full transition-opacity duration-1000">
      {image}
      <div className="bg-background/80 absolute inset-0 mix-blend-multiply" />
      {tone === "background" ? (
        <>
          <div className="from-background via-background/50 absolute inset-0 bg-linear-to-t to-transparent" />
          <div className="from-background/20 absolute inset-0 bg-linear-to-b via-transparent to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-b from-zinc-950/20 via-transparent to-transparent" />
        </>
      )}
    </div>
  );
}
