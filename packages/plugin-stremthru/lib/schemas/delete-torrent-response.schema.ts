import z from "zod";

export const DeleteTorrentResponse = z.object({
  data: z.object({
    id: z.string(),
  }),
});

export type DeleteTorrentResponse = z.infer<typeof DeleteTorrentResponse>;
