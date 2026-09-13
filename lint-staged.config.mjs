/**
 * @type {import('lint-staged').Configuration}
 */
const lintStagedConfig = {
  "*.{js,jsx,cjs,mjs,ts,tsx,cts,mts,json,md,mdx,html,yml,yaml}":
    "oxfmt --write --no-error-on-unmatched-pattern",
  "*-settings.schema.ts": async () => "turbo codegen:config-docs",
};

export default lintStagedConfig;
