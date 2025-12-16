import { defineConfig } from "@kubb/core";
import { pluginZod } from "@kubb/plugin-zod";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginMsw } from "@kubb/plugin-msw";
import { pluginFaker } from "@kubb/plugin-faker";
import { pluginTs } from "@kubb/plugin-ts";

export default defineConfig(() => {
  return {
    name: "Listrr",
    root: ".",
    input: {
      path: "./openapi-schema.json",
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
      pluginFaker({
        unknownType: "unknown",
      }),
      pluginTs(),
      pluginMsw({
        baseURL: "https://listrr.pro",
        parser: "faker",
      }),
    ],
    hooks: {
      done: ['pnpm prettier --write "lib/__generated__"'],
    },
  };
});
