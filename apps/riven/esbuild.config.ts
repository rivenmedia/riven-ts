import * as esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { swcPlugin } from "esbuild-plugin-swc";

await esbuild.build({
  treeShaking: true,
  entryPoints: [
    "lib/index.ts",
    "lib/message-queue/sandboxed-jobs/jobs/**/*.processor.ts",
  ],
  tsconfig: "tsconfig.json",
  bundle: true,
  platform: "node",
  splitting: true,
  outdir: "dist",
  sourcemap: true,
  sourceRoot: "lib",
  format: "esm",
  keepNames: true,
  plugins: [
    nodeExternalsPlugin({
      allowWorkspaces: true,
    }),
    swcPlugin({
      jsc: {
        parser: {
          decorators: true,
          syntax: "typescript",
        },
      },
    }),
  ],
});
