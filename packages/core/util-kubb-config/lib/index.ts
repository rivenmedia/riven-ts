import { type InputData, type InputPath, defineConfig } from "@kubb/core";
import { pluginFaker } from "@kubb/plugin-faker";
import { pluginMsw } from "@kubb/plugin-msw";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";

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
        version: "4",
        output: {
          banner: "// @ts-nocheck",
          path: "zod",
        },
      }),
      pluginFaker({
        unknownType: "unknown",
        output: {
          banner: "// @ts-nocheck",
          path: "mocks",
        },
      }),
      pluginTs(),
      pluginMsw({
        baseURL,
        parser: "faker",
        output: {
          banner: "// @ts-nocheck",
          path: "handlers",
        },
      }),
    ],
  }));
