import { isFeatureEnabled } from "#lib/enabled-features.ts";

import { DangerZone } from "../_components/danger-zone/danger-zone";
import { SettingsSection } from "../_components/settings-section/settings-section";

export default function GeneralSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <SettingsSection id="general" />
      {isFeatureEnabled("dangerZone") && <DangerZone />}
    </div>
  );
}
