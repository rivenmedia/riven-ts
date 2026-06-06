import { isEmptyObject } from "es-toolkit";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { zod2md } from "zod2md";

export interface GenerateZodDocsOptions {
  files: Record<string, string>;
  outDir?: string;
}

export async function generateZodDocs({
  files,
  outDir = "docs/__generated__",
}: GenerateZodDocsOptions) {
  if (isEmptyObject(files)) {
    throw new Error("No files provided");
  }

  for (const [title, entry] of Object.entries(files)) {
    const parsedPath = path.parse(entry);
    const markdown = await zod2md({
      title,
      entry,
    });

    const formattedMarkdown = markdown.replace(`# ${title}`, "").trim();

    const outputPath = path.resolve(outDir, `${parsedPath.name}.mdx`);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, formattedMarkdown);
  }
}
