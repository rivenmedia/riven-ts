import { defineConfig } from "@kubb/core";
import { pluginZod } from "@kubb/plugin-zod";
import { pluginOas } from "@kubb/plugin-oas";

export default defineConfig(() => {
  return {
    root: ".",
    input: {
      path: "https://listrr.pro/swagger/v1/swagger.json",
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
