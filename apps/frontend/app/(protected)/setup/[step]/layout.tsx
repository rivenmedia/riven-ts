import { Mountain } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Riven - Initial Setup",
};

export default function SetupLayout({
  children,
}: LayoutProps<"/setup/[step]">) {
  return (
    <div className="bg-background min-h-screen w-full">
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#31231c_0%,transparent_34%),radial-gradient(circle_at_right,#1b171d_0%,transparent_26%),linear-gradient(180deg,#0f0d10_0%,#151115_100%)]"></div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]"></div>
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 md:px-10 lg:px-12">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-[0.28em] uppercase">
                Initial Setup
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="text-primary flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Mountain className="size-5" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Riven
                </h1>
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
