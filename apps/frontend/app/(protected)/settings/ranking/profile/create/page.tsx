import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";

import { SettingsSectionSkeleton } from "../../../_components/settings-section/settings-section";
import { RankingProfileForm } from "../../_components/ranking-profile-form";
import {
  fetchRankingProfileSchema,
  fetchRankingProfiles,
} from "../../_data-access/fetch-ranking-profiles";

/** The slug of the built-in profile that new profiles start from. */
const DEFAULT_PROFILE_SLUG = "default";

async function CreateRankingProfile() {
  const [jsonSchema, profiles] = await Promise.all([
    fetchRankingProfileSchema(),
    fetchRankingProfiles(),
  ]);
  const defaultProfile = profiles.find(
    ({ builtIn, slug }) => builtIn && slug === DEFAULT_PROFILE_SLUG,
  );

  if (!defaultProfile) {
    notFound();
  }

  return (
    <RankingProfileForm
      jsonSchema={jsonSchema}
      values={{ ...defaultProfile.values, name: "", description: null }}
    />
  );
}

export default function CreateRankingProfilePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Create Ranking Profile</h2>
        <p className="text-muted-foreground text-sm">
          Define the settings for your new ranking profile below. It starts from
          the default profile.
        </p>
      </div>
      <ErrorFallback message="Failed to load the ranking profile form">
        <Suspense fallback={<SettingsSectionSkeleton />}>
          <CreateRankingProfile />
        </Suspense>
      </ErrorFallback>
    </div>
  );
}
