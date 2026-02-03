import type { Config } from "zod2md";

export default {
  title: "Settings",
  output: "./docs/settings.md",
  entry: "./lib/torrentio-settings.schema.ts",
} satisfies Config;
