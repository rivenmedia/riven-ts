import z from "zod";

export const LookupByTvdbIdResponse = z.object({
  _links: z.object({
    nextepisode: z
      .object({
        href: z.url(),
      })
      .optional(),
  }),
});

export type LookupByTvdbIdResponse = z.infer<typeof LookupByTvdbIdResponse>;
