import { permissionActionClient } from "@/lib/server-actions/action-client";

import z from "zod";

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
