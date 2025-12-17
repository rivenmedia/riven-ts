import { defineConfig, type InputData, type InputPath } from "@kubb/core";
import { pluginZod } from "@kubb/plugin-zod";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginMsw } from "@kubb/plugin-msw";
import { pluginFaker } from "@kubb/plugin-faker";
import { pluginTs } from "@kubb/plugin-ts";

interface KubbConfigOptions {
  name: string;
  input: InputPath | InputData;
  baseURL?: string;
}

export const buildKubbConfig = ({
  name,
  input,
  baseURL = "",
}: KubbConfigOptions): ReturnType<typeof defineConfig> =>
  defineConfig(() => ({
    name,
    root: ".",
    input,
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
        baseURL,
        parser: "faker",
      }),
    ],
    hooks: {
      done: ['pnpm prettier --write "lib/__generated__"'],
    },
  }));
