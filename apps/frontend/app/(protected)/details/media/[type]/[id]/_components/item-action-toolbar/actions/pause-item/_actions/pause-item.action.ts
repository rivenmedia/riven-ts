"use server";

import z from "zod";

import { permissionActionClient } from "#lib/server-actions/action-client.ts";

export const pauseItem = permissionActionClient
  .metadata({
    permissions: {
      item: ["pause"],
    },
  })
  .inputSchema(
    z.object({
      id: z.uuid(),
    }),
  )
  .action(async () => {
    console.log("hi pause");
    return {
      success: true,
    };
  });
