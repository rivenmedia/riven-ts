"use server";

import z from "zod";

import { permissionActionClient } from "#lib/server-actions/action-client.ts";

export const resumeItem = permissionActionClient
  .metadata({
    permissions: {
      item: ["request"],
    },
  })
  .inputSchema(
    z.object({
      id: z.uuid(),
    }),
  )
  .action(async () => {
    console.log("hi resume");
    return {
      success: true,
    };
  });
