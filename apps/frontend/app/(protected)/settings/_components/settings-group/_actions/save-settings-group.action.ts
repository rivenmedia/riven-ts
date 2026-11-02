import { permissionActionClient } from "#lib/server-actions/action-client.ts";

export const saveSettingsGroup = permissionActionClient
  .metadata({ permissions: { instance: ["manage-settings"] } })
  // oxlint-disable-next-line typescript/require-await
  .action(async () => {
    // oxlint-disable-next-line no-console
    console.log("Saving settings group");
  });
