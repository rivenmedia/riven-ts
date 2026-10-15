"use server";

import z from "zod";

import { permissionActionClient } from "#lib/server-actions/action-client.ts";

export const resetItem = permissionActionClient
  .metadata({
    permissions: {
      item: ["reset"],
    },
  })
  .inputSchema(
    z.object({
      id: z.uuid(),
    }),
  )
  .action(async () => {
    console.log("hi reset");
    return {
      success: true,
    };
  });
