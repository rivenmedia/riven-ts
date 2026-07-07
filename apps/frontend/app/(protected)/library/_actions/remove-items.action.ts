import z from "zod";

import { permissionActionClient } from "@/lib/server-actions/action-client";

export const removeItems = permissionActionClient
  .metadata({
    permissions: {
      item: ["delete"],
    },
  })
  .inputSchema(
    z.object({
      ids: z.array(z.string()),
    }),
  )
  .action(async ({ parsedInput }) => {});
