import metaUrlPlugin from "@chialab/esbuild-plugin-meta-url";
import * as esbuild from "esbuild";
import { swcPlugin } from "esbuild-plugin-swc";
import tscPlugin from "esbuild-plugin-tsc";

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
  packages: "external",
  plugins: [
    metaUrlPlugin({
      emit: true,
    }),
    swcPlugin({
      jsc: {
        parser: {
          decorators: true,
          syntax: "typescript",
        },
      },
    }),
    tscPlugin(),
  ],
});
