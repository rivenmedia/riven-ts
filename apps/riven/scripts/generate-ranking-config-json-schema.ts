import chalk from "chalk";
import { writeFileSync } from "node:fs";
import z from "zod";

import { RankingConfig } from "../lib/ranking-config/ranking-config.schema.ts";

const filePath = `${process.cwd()}/ranking-config.schema.json`;
const jsonSchema = z.toJSONSchema(RankingConfig, {
  io: "input",
});

writeFileSync(filePath, JSON.stringify(jsonSchema, null, 2));

console.log(chalk.green("Successfully generated JSON schema"));
