import type { Config } from "zod2md";

export default {
  title: "Settings",
  output: "./docs/settings.md",
  entry: "./lib/riven-settings.schema.ts",
} satisfies Config;
