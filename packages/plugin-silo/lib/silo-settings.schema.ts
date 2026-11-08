import z from "zod";

export const SiloSettings = z
  .object({
    siloApiKey: z
      .string()
      .startsWith("sa_", 'Silo API key must start with "sa_"')
      .describe(
        "Silo API key for accessing the Silo API. Must belong to an administrator, as library scans require admin access.",
      )
      .meta({ secret: true }),
    siloServerUrl: z
      .url({
        error: "Silo server URL must be a valid URL",
        protocol: z.regexes.httpProtocol,
      })
      .describe(
        "The URL of your Silo server, without a path, e.g., http://localhost:8090/. Use its web port, not the Jellyfin-compatible port.",
      ),
    siloLibraryPath: z
      .string()
      .min(1, "Silo library path is required")
      .describe(
        'The start of Silo library paths, e.g. "/mount" in "/mount/movies"',
      )
      .default("/mount"),
  })
  .meta({ title: "Silo" });

export type SiloSettings = z.infer<typeof SiloSettings>;
