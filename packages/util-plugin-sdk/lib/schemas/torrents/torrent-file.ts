import z from "zod";

export const TorrentFile = z
  .object({
    id: z.int(),
    path: z.string(),
    bytes: z.int().nonnegative(),
    selected: z.literal([0, 1]),
    downloadUrl: z.url().nullable(),
  })
  .transform((file) => ({
    ...file,
    fileName: file.path.split("/").pop() ?? "",
  }));

export type TorrentFile = z.infer<typeof TorrentFile>;
