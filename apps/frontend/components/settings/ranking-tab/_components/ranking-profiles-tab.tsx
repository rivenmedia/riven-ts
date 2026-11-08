"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "#components/_ui/button.tsx";

import { RankingProfileCard } from "./ranking-profile-card.tsx";

export interface RankingProfilesTabProps {
  selectedProfile: string;
}

export function RankingProfilesTab({
  selectedProfile,
}: RankingProfilesTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Ranking Profiles</h2>
        <p className="text-sm text-muted-foreground">
          Choose a ranking profile that best suits your needs, or customise your
          own settings if needed.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <RankingProfileCard
          title="Performant"
          description="Optimised for streaming performance."
          isSelected={selectedProfile === "performant"}
        />
        <RankingProfileCard
          title="Balanced"
          description="A good mix of quality and size."
          isSelected={selectedProfile === "balanced"}
        />
        <RankingProfileCard
          title="Best Quality"
          description="Highest resolution and bitrate."
          isSelected={selectedProfile === "best-quality"}
        />
      </div>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Custom Profiles</h2>
        <Button asChild>
          <Link href="/settings/ranking/profile/create">
            Create Custom Profile <ChevronRight />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        Custom profiles list
      </div>
    </div>
  );
}
