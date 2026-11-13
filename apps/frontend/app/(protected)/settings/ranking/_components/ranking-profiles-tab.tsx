import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "#components/_ui/button.tsx";
import { Skeleton } from "#components/_ui/skeleton.tsx";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";

import { fetchRankingProfiles } from "../_data-access/fetch-ranking-profiles";
import { RankingProfileCard } from "./ranking-profile-card";

import type { RankingProfilesQuery } from "../_queries/ranking-profiles.query.typegen";

const gridClassName = "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3";

function RankingProfileGrid({
  profiles,
}: {
  profiles: RankingProfilesQuery["rankingProfiles"];
}) {
  return (
    <div className={gridClassName}>
      {profiles.map(({ builtIn, id, name, description, isActive }) => (
        <RankingProfileCard
          key={id}
          profile={{
            id,
            name,
            description,
            builtIn,
            isActive,
          }}
        />
      ))}
    </div>
  );
}

async function RankingProfilesLoader() {
  const profiles = await fetchRankingProfiles();
  const builtInProfiles = profiles.filter(({ builtIn }) => builtIn);
  const customProfiles = profiles.filter(({ builtIn }) => !builtIn);

  return (
    <>
      <RankingProfileGrid profiles={builtInProfiles} />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Custom Profiles</h2>
        <Button asChild>
          <Link href="/settings/ranking/profile/create">
            Create Custom Profile <ChevronRight />
          </Link>
        </Button>
      </div>
      {customProfiles.length > 0 ? (
        <RankingProfileGrid profiles={customProfiles} />
      ) : (
        <p className="text-muted-foreground text-sm">No custom profiles yet.</p>
      )}
    </>
  );
}

function RankingProfilesSkeleton() {
  return (
    <div className={gridClassName}>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

/** The built-in and custom ranking profiles, each with its actions. */
export function RankingProfilesTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Ranking Profiles</h2>
        <p className="text-muted-foreground text-sm">
          Choose a ranking profile that best suits your needs, or create your
          own from one.
        </p>
      </div>
      <ErrorFallback message="Failed to load the ranking profiles">
        <Suspense fallback={<RankingProfilesSkeleton />}>
          <RankingProfilesLoader />
        </Suspense>
      </ErrorFallback>
    </div>
  );
}
