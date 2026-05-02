import { z } from "@rivenmedia/plugin-sdk/validation";

export const GenerateLinkResponse = z.object({
  data: z.object({
    link: z.url(),
  }),
});

export type GenerateLinkResponse = z.infer<typeof GenerateLinkResponse>;
