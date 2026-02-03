/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  "*.{js,jsx,cjs,mjs,ts,tsx,cts,mts,json,md,mdx,html,yml,yaml}":
    "prettier --write",
  "package.json": "sort-package-json",
  "*-settings.schema.ts": async () => "turbo generate-config-docs",
};
