import { generateZodDocs } from "@repo/util-wiki-helpers/generate-zod-docs";

await generateZodDocs({
  files: {
    "Bootstrap Settings": "lib/riven-settings.schema.ts",
    "General Settings": "lib/settings/sections/general-settings.schema.ts",
    "Plugins Settings": "lib/settings/sections/plugins-settings.schema.ts",
    "Frontend Settings": "lib/riven-frontend-settings.schema.ts",
  },
});
