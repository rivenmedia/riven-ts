import { readFile } from "node:fs/promises";
import { defineConfig } from "@kubb/core";
import { pluginZod } from "@kubb/plugin-zod";
import { pluginOas } from "@kubb/plugin-oas";
import apib2openapi from "apib2openapi";

export default defineConfig(async () => {
  const apibSpec = await readFile("./lib/schema.apib", "utf-8");
  const openapiSpec = await apib2openapi.convert(apibSpec, {});

  return {
    name: "MDBList",
    root: ".",
    input: {
      data: openapiSpec,
    },
    output: {
      path: "./lib/__generated__",
      clean: true,
    },
    plugins: [
      pluginOas({
        validate: false,
      }),
      pluginZod({
        inferred: true,
      }),
    ],
    hooks: {
      done: ['pnpm prettier --write "lib/__generated__"'],
    },
  };
});
