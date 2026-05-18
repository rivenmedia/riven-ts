import z from "zod";

export const TmdbSettings = z.object({
  apiKey: z
    .string()
    .min(1, "API Key is required")
    .default(
      "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1ZjdiZDI5OGRkMTg4Y2Q0YzY5YmRkMGYxMDQ2ZGRjNCIsIm5iZiI6MTc3OTEwOTg1MS43NDgsInN1YiI6IjZhMGIwZmRiMmY3MWVhYzVkZmQ3ZmNkNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.GZtdnAqFW356rE3HJwQAkpQWs8s5hK2nY4hvRc2mDrY",
    )
    .describe("Your TMDB API Key"),
});

export type TmdbSettings = z.infer<typeof TmdbSettings>;
