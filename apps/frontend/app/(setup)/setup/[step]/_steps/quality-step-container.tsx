"use client";

import { useQuery } from "@apollo/client/react";

import { RANKING_PROFILES } from "#app/(protected)/settings/ranking/_queries/ranking-profiles.query.ts";

import { SetupQualityStep } from "./quality.tsx";

/**
 * Loads the ranking profiles and renders the quality step once they're
 * available, so the active profile is pre-selected.
 */
export function SetupQualityStepContainer() {
  const { data } = useQuery(RANKING_PROFILES);

  if (!data) {
    return null;
  }

  return (
    <SetupQualityStep
      generalSections={[]}
      profiles={data.rankingProfiles.map(
        ({ id, name, description, isActive }) => ({
          id,
          label: name,
          description: description ?? "",
          enabled: isActive,
        }),
      )}
    />
  );
}
