import { json } from "@repo/util-plugin-sdk/validation";

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import z from "zod";

import { RankingConfig } from "./ranking-config.schema.ts";

import type { RankingConfigFileContents } from "./ranking-config.schema.ts";

async function writeDefaultConfigFile(resolvedPath: string) {
  const contents = {
    $schema:
      "https://raw.githubusercontent.com/rivenmedia/riven-ts/main/apps/riven/ranking-config.schema.json",
    rankingModel: "default",
  } as const satisfies RankingConfigFileContents;

  await writeFile(resolvedPath, JSON.stringify(contents, null, 2), {
    encoding: "utf8",
    flag: "wx",
  });
}

export async function loadRankingConfig(
  configPath: string,
): Promise<RankingConfig> {
  const resolvedPath = path.resolve(configPath);

  const fileExists = await stat(resolvedPath)
    .then(() => true)
    .catch(() => false);

  if (!fileExists) {
    await mkdir(path.dirname(resolvedPath), { recursive: true });

    try {
      await writeDefaultConfigFile(resolvedPath);
    } catch (error) {
      if (
        error === null ||
        typeof error !== "object" ||
        (error as NodeJS.ErrnoException).code !== "EEXIST"
      ) {
        throw new Error(
          `Failed to create ranking config file at "${resolvedPath}": ${String(error)}`,
          { cause: error },
        );
      }
    }
  }

  const raw = await readFile(resolvedPath, "utf8").catch((error: unknown) => {
    throw new Error(
      `Failed to read ranking config file at "${resolvedPath}": ${String(error)}`,
    );
  });

  const parsed = json(RankingConfig).safeDecode(raw);

  if (!parsed.success) {
    throw new Error(
      `Invalid ranking config file at "${resolvedPath}":\n${z.prettifyError(parsed.error)}`,
    );
  }

  return parsed.data;
}
