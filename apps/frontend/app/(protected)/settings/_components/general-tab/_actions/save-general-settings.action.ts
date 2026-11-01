"use server";

import { permissionActionClient } from "#lib/server-actions/action-client.ts";

export const saveGeneralSettings = permissionActionClient
  .metadata({
    permissions: { instance: ["manage-settings"] },
  })
  .action(async () => {
    console.log("Saving settings...");
  });
