import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["lib/message-queue/sandboxed-jobs/jobs/**/*.processor.ts"],
  outdir: "dist/workers",
  bundle: true,
  platform: "node",
  splitting: true,
  format: "esm",
  sourcemap: true,
  treeShaking: true,
  external: ["bullmq", "winston"],
});
