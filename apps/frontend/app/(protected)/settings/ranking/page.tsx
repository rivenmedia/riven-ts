import { notFound } from "next/navigation";

import { RankingTab } from "#components/settings/ranking-tab/ranking-tab.tsx";
import { isFeatureEnabled } from "#lib/enabled-features.ts";

export default function RankingSettingsPage() {
  if (!isFeatureEnabled("rankingTab")) {
    notFound();
  }

  return <RankingTab selectedProfile="balanced" />;
}
