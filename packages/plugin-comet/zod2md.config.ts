import type { Config } from "zod2md";

export default {
  title: "Settings",
  output: "./docs/settings.md",
  entry: "./lib/comet-settings.schema.ts",
} satisfies Config;
