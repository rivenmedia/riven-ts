import { z } from "zod";

export const IndexerDataStatus = z.preprocess(
  (val) => (typeof val === "string" ? val.toLowerCase() : val),
  // oxlint-disable-next-line unicorn/prefer-top-level-await - zod's .catch() isn't a promise function
  z.enum(["released", "unreleased", "ongoing", "unknown"]).catch("unknown"),
);

export type IndexerDataStatus = z.infer<typeof IndexerDataStatus>;
