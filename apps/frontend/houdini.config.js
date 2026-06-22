/// <references types="houdini-svelte">

/** @type {import('houdini').ConfigFile} */
const config = {
  runtimeDir: ".houdini",
  schemaPath: "../riven/schema.graphql",
  plugins: {
    "houdini-svelte": {},
  },
};

export default config;
