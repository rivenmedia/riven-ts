import { z } from "@rivenmedia/plugin-sdk/validation";

export const DeleteTorrentResponse = z.object({
  data: z.object({
    id: z.string(),
  }),
});

export type DeleteTorrentResponse = z.infer<typeof DeleteTorrentResponse>;
