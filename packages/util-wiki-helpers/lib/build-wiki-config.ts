import { defineConfig, defineDocs } from "fumadocs-mdx/config";

export const dir = import.meta.dirname;

interface WikiConfig {
  docs: ReturnType<typeof defineDocs>;
  config: ReturnType<typeof defineConfig>;
}

export function buildWikiConfig(rootDir: string): WikiConfig {
  const docsDir = `${rootDir}/docs`;

  return {
    docs: defineDocs({
      dir: docsDir,
      docs: {
        files: [`${docsDir}/**/*.mdx`, `!${docsDir}/**/__generated__/**`],
      },
    }),
    config: defineConfig(),
  };
}
