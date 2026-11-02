import { permissionActionClient } from "#lib/server-actions/action-client.ts";

export const resetLibrary = permissionActionClient
  .metadata({
    permissions: {
      library: ["reset"],
    },
  })
  // oxlint-disable-next-line typescript/require-await
  .action(async () => {
    // oxlint-disable-next-line no-console
    console.log("Resetting library...");
  });
