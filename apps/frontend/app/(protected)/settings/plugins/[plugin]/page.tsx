import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  SettingsSection,
  SettingsSectionSkeleton,
} from "../../_components/settings-section/settings-section";
import { fetchSettingsPlugins } from "../_data-access/fetch-settings-plugins";

async function PluginSettings({
  params,
}: Pick<PageProps<"/settings/plugins/[plugin]">, "params">) {
  // The route segment is the plugin's settings section ID
  const { plugin: sectionId } = await params;
  const { plugins } = await fetchSettingsPlugins();

  if (!plugins.some(({ id }) => id === sectionId)) {
    notFound();
  }

  return <SettingsSection id={sectionId} />;
}

export default function PluginSettingsPage({
  params,
}: PageProps<"/settings/plugins/[plugin]">) {
  return (
    <Suspense fallback={<SettingsSectionSkeleton />}>
      <PluginSettings params={params} />
    </Suspense>
  );
}
