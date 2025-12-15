import { defineConfig } from "@kubb/core";
import { pluginZod } from "@kubb/plugin-zod";
import { pluginOas } from "@kubb/plugin-oas";
import apib2openapi from "apib2openapi";

export default defineConfig(async () => {
  const response = await fetch(
    "https://raw.githubusercontent.com/linaspurinis/api.mdblist.com/refs/heads/main/apiary.apib",
  );
  const apibSpec = await response.text();
  const openapiSpec = await apib2openapi.convert(apibSpec, {});

  return {
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
