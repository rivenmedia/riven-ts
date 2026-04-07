import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: [
    "lib/message-queue/sandboxed-jobs/jobs/map-items-to-files/map-items-to-files.processor.ts",
    "lib/message-queue/sandboxed-jobs/jobs/parse-scrape-results/parse-scrape-results.processor.ts",
    "lib/message-queue/sandboxed-jobs/jobs/validate-torrent-files/validate-torrent-files.processor.ts",
  ],
  outdir: "dist",
  bundle: true,
  platform: "node",
  splitting: true,
  format: "esm",
  sourcemap: true,
  treeShaking: true,
});
