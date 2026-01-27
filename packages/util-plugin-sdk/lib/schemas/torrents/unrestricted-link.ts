import z from "zod";

export const UnrestrictedLink = z.object({
  download: z.url(),
  filename: z.string(),
  filesize: z.number().int().nonnegative(),
});

export type UnrestrictedLink = z.infer<typeof UnrestrictedLink>;
