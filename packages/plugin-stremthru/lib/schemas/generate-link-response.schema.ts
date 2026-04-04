import { type } from "arktype";

export const GenerateLinkResponse = type({
  data: {
    link: "string.url",
  },
});

export type GenerateLinkResponse = typeof GenerateLinkResponse.infer;
