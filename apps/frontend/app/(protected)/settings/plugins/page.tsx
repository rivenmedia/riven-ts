import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";

import { fetchSettingsPlugins } from "./_data-access/fetch-settings-plugins";

async function FirstPluginRedirect() {
  const {
    plugins: [firstPlugin],
  } = await fetchSettingsPlugins();

  if (!firstPlugin) {
    return (
      <p className="text-muted-foreground text-sm">No plugins registered.</p>
    );
  }

  redirect(`/settings/plugins/${firstPlugin.id}`);
}

export default function PluginsSettingsPage() {
  return (
    <ErrorFallback message="Failed to load settings">
      <Suspense>
        <FirstPluginRedirect />
      </Suspense>
    </ErrorFallback>
  );
}
