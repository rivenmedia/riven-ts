import { generateZodDocs } from "@repo/util-wiki-helpers/generate-zod-docs";

await generateZodDocs({
  files: {
    Settings: "lib/stremthru-settings.schema.ts",
  },
});
