import { build } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";

await build({
  entryPoints: ["lib/message-queue/sandboxed-jobs/jobs/**/*.processor.ts"],
  outdir: "dist/workers",
  bundle: true,
  platform: "node",
  splitting: true,
  format: "esm",
  sourcemap: true,
  treeShaking: true,
  minify: true,
  plugins: [nodeExternalsPlugin({ allowWorkspaces: true })],
});
