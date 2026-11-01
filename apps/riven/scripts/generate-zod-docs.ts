import { generateZodDocs } from "@repo/util-wiki-helpers/generate-zod-docs";

await generateZodDocs({
  files: {
    Settings: "lib/riven-settings.schema.ts",
    "Frontend Settings": "lib/riven-frontend-settings.schema.ts",
  },
});
