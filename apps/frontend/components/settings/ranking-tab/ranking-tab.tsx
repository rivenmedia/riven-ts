import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/_ui/tabs";

import { RankingProfilesTab } from "./_components/ranking-profiles-tab";
import { RankingSettingsTab } from "./_components/ranking-settings-tab";

export interface RankingTabProps {
  selectedProfile: string;
}

export function RankingTab({ selectedProfile }: RankingTabProps) {
  return (
    <Tabs defaultValue="ranking-profiles" className="space-y-4">
      <TabsList variant="line">
        <TabsTrigger value="ranking-profiles">Ranking Profiles</TabsTrigger>
        <TabsTrigger value="ranking-settings">Ranking Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="ranking-profiles">
        <RankingProfilesTab selectedProfile={selectedProfile} />
      </TabsContent>
      <TabsContent value="ranking-settings">
        <RankingSettingsTab />
      </TabsContent>
    </Tabs>
  );
}
