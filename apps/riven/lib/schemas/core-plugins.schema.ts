import z from "zod";

import packageJson from "../../package.json" with { type: "json" };

import type { Replace } from "type-fest";

type CorePluginName = Replace<
  Extract<keyof typeof packageJson.dependencies, `@repo/plugin-${string}`>,
  "@repo/plugin-",
  ""
>;

export const CorePlugins = z.enum(
  Object.keys(packageJson.dependencies)
    .filter((dependency) => dependency.startsWith("@repo/plugin-"))
    .map((dependency) =>
      dependency.replace("@repo/plugin-", ""),
    ) as CorePluginName[],
);
