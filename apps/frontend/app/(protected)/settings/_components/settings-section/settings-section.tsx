import { io } from "next/cache";
import { Suspense } from "react";

import { Skeleton } from "#components/_ui/skeleton.tsx";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";
import { query } from "#lib/graphql/client.ts";

import { SETTINGS_SECTION } from "./_queries/settings-section.query";
import { SettingsSectionForm } from "./settings-section-form";

interface SettingsSectionLoaderProps {
  id: string;
}

async function SettingsSectionLoader({ id }: SettingsSectionLoaderProps) {
  await io();

  const { data, error } = await query({
    query: SETTINGS_SECTION,
    variables: { id },
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(`Failed to load the "${id}" settings section`);
  }

  const { settingsSection } = data;

  return (
    <SettingsSectionForm
      id={settingsSection.id}
      title={settingsSection.title}
      jsonSchema={settingsSection.jsonSchema}
      values={settingsSection.values}
      lockedFields={settingsSection.lockedFields}
      secretStates={settingsSection.secretStates.map(({ path, state }) => ({
        path,
        state,
      }))}
      issues={settingsSection.issues.map(({ path, message }) => ({
        path,
        message,
      }))}
    />
  );
}

/** Placeholder shown while a settings section loads. */
export function SettingsSectionSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

interface SettingsSectionProps {
  id: string;
}

/** Loads a backend settings section and renders it as a form. */
export function SettingsSection({ id }: SettingsSectionProps) {
  return (
    <ErrorFallback message="Failed to load settings">
      <Suspense fallback={<SettingsSectionSkeleton />}>
        <SettingsSectionLoader id={id} />
      </Suspense>
    </ErrorFallback>
  );
}
