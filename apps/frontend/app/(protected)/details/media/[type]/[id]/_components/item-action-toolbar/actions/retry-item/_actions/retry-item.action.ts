import z from "zod";

import { permissionActionClient } from "#lib/server-actions/action-client.ts";

export const retryItem = permissionActionClient
  .metadata({
    permissions: {
      item: ["retry"],
    },
  })
  .inputSchema(
    z.object({
      id: z.uuid(),
    }),
  )
  .action(async () => {
    console.log("hi retry");
    return {
      success: true,
    };
  });
