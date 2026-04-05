import { type InputData, type InputPath, defineConfig } from "@kubb/core";
import { pluginFaker } from "@kubb/plugin-faker";
import { pluginMsw } from "@kubb/plugin-msw";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";

const outputPath = "./lib/__generated__";

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
      path: outputPath,
      clean: true,
      format: false, // Disable formatting to allow Prettier to handle it in the hooks.
      barrelType: false,
    },
    hooks: {
      done: [`prettier --log-level silent --write ${outputPath}/**/*.ts`],
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
          barrelType: false,
        },
      }),
      pluginFaker({
        unknownType: "unknown",
        output: {
          banner: "// @ts-nocheck",
          path: "mocks",
          barrelType: false,
        },
      }),
      pluginTs({
        output: {
          path: "types",
          barrelType: false,
        },
      }),
      pluginMsw({
        baseURL,
        parser: "faker",
        output: {
          banner: "// @ts-nocheck",
          path: "handlers",
          barrelType: false,
        },
      }),
    ],
  }));
