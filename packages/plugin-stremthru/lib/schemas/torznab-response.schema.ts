import { z } from "@rivenmedia/plugin-sdk/validation";

const TorznabItem = z.object({
  title: z.string(),
  attr: z.array(
    z.object({
      "@attributes": z.object({
        name: z.string(),
        value: z.string(),
      }),
    }),
  ),
});

export const TorznabResponse = z.object({
  channel: z.object({
    items: z.array(TorznabItem).default([]),
  }),
});
