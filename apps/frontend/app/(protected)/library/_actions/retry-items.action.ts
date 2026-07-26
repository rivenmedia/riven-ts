import { permissionActionClient } from "@/lib/server-actions/action-client";

import z from "zod";

export const retryItems = permissionActionClient
  .metadata({
    permissions: {
      item: ["retry"],
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
