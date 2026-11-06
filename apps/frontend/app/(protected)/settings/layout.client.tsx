import { PageShell } from "#components/page-shell/page-shell.tsx";

import { RestartBanner } from "./_components/restart-banner/restart-banner";
import { SettingsNav } from "./_components/settings-nav";

import type { PropsWithChildren } from "react";

/**
 * Settings routes, with tabs for the General, Plugins and Ranking sections
 * and a banner when Riven needs a restart.
 */
export function SettingsLayout({ children }: PropsWithChildren) {
  return (
    <PageShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure Riven, plugins, and ranking preferences.
          </p>
        </div>
        <RestartBanner />
        <SettingsNav>{children}</SettingsNav>
      </div>
    </PageShell>
  );
}
