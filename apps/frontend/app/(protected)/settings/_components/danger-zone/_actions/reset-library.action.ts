import { permissionActionClient } from "#lib/server-actions/action-client.ts";

export const resetLibrary = permissionActionClient
  .metadata({
    permissions: {
      library: ["reset"],
    },
  })
  .action(() => {
    console.log("Resetting library...");
  });
