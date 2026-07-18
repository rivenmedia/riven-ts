import z from "zod";

import { permissionActionClient } from "@/lib/server-actions/action-client";

export const resetItems = permissionActionClient
  .metadata({
    permissions: {
      item: ["reset"],
    },
  })
  .inputSchema(
    z.object({
      ids: z.array(z.string()),
    }),
  )
  .action(async ({ parsedInput }) => {
    return {
      count: 0,
    };
  });
