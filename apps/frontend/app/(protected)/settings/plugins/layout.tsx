import { Suspense } from "react";

import { Skeleton } from "#components/_ui/skeleton.tsx";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";

import { PluginNav } from "./_components/plugin-nav";
import { fetchSettingsPlugins } from "./_data-access/fetch-settings-plugins";

async function PluginNavLoader() {
  const { plugins, enabledPluginsLocked } = await fetchSettingsPlugins();

  return (
    <PluginNav
      plugins={plugins.map(({ id, title, enabled, alwaysEnabled }) => ({
        id,
        title,
        enabled,
        alwaysEnabled,
      }))}
      enabledPluginsLocked={enabledPluginsLocked}
    />
  );
}

function PluginNavSkeleton() {
  return (
    <div className="flex w-full flex-col gap-2 md:w-60 md:shrink-0">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

export default function PluginsSettingsLayout({
  children,
}: LayoutProps<"/settings/plugins">) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <ErrorFallback
        message="Failed to load plugins"
        className="md:w-60 md:shrink-0"
      >
        <Suspense fallback={<PluginNavSkeleton />}>
          <PluginNavLoader />
        </Suspense>
      </ErrorFallback>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
