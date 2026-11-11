import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#components/_ui/tabs.tsx";

import { SettingsSection } from "../../_components/settings-section/settings-section";
import { RankingProfilesTab } from "./ranking-profiles-tab";

/** Tabs for choosing a ranking profile and adjusting the ranking settings. */
export function RankingTab() {
  return (
    <Tabs defaultValue="ranking-profiles" className="space-y-4">
      <TabsList variant="line">
        <TabsTrigger value="ranking-profiles">Ranking Profiles</TabsTrigger>
        <TabsTrigger value="ranking-settings">Ranking Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="ranking-profiles">
        <RankingProfilesTab />
      </TabsContent>
      <TabsContent value="ranking-settings">
        <SettingsSection id="ranking" />
      </TabsContent>
    </Tabs>
  );
}
