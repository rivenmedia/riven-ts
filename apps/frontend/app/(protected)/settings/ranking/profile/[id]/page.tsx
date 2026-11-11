import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";

import { SettingsSectionSkeleton } from "../../../_components/settings-section/settings-section";
import { RankingProfileForm } from "../../_components/ranking-profile-form";
import {
  fetchRankingProfileSchema,
  fetchRankingProfiles,
} from "../../_data-access/fetch-ranking-profiles";

async function EditRankingProfile({
  params,
}: Pick<PageProps<"/settings/ranking/profile/[id]">, "params">) {
  const { id } = await params;
  const [jsonSchema, profiles] = await Promise.all([
    fetchRankingProfileSchema(),
    fetchRankingProfiles(),
  ]);
  const profile = profiles.find((candidate) => candidate.id === id);

  // Built-in profiles are read-only
  if (!profile || profile.builtIn) {
    notFound();
  }

  return (
    <RankingProfileForm
      jsonSchema={jsonSchema}
      values={profile.values}
      profileId={profile.id}
    />
  );
}

export default function EditRankingProfilePage({
  params,
}: PageProps<"/settings/ranking/profile/[id]">) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Edit Ranking Profile</h2>
      {/* The boundary lets `notFound()` through to the not found page */}
      <ErrorFallback message="Failed to load the ranking profile">
        <Suspense fallback={<SettingsSectionSkeleton />}>
          <EditRankingProfile params={params} />
        </Suspense>
      </ErrorFallback>
    </div>
  );
}
