import { permissionActionClient } from "#lib/server-actions/action-client.ts";

export const saveSettingsGroup = permissionActionClient
  .metadata({ permissions: { instance: ["manage-settings"] } })
  .action(async () => {
    console.log("Saving settings group");
  });
