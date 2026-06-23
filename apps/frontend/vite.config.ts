import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { svelteTesting } from "@testing-library/svelte/vite";
import houdini from "houdini/vite";
import { type UserConfig, defineConfig, loadEnv, mergeConfig } from "vite";

import packageJson from "./package.json" with { type: "json" };
import svelteConfig from "./svelte.config.ts";

export default defineConfig(async (config) => {
  const env = loadEnv(config.mode, process.cwd(), "");
  const backendUrl = env["BACKEND_URL"] ?? "http://localhost:8080";
  const apiKey = env["BACKEND_API_KEY"] ?? env["RIVEN_SETTING__API_KEY"] ?? "";

  const baseConfig = baseVitestConfig(config);

  const houdiniPlugin = (await houdini()).filter((option) => {
    if (config.mode !== "test") {
      return true;
    }

    // Remove any hot update listeners that cause Vitest to hang
    return (
      typeof option === "object" && option != null && !("hotUpdate" in option)
    );
  });

  return mergeConfig<UserConfig, UserConfig>(baseConfig, {
    plugins: [
      houdiniPlugin,
      tailwindcss(),
      sveltekit(svelteConfig.kit),
      svelteTesting(),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
    },
    server: {
      proxy: {
        "/graphql": {
          target: backendUrl,
          ws: true,
          changeOrigin: true,
          configure: (proxy) => {
            const attach = (req: {
              setHeader: (k: string, v: string) => void;
            }) => {
              if (apiKey) {
                req.setHeader("x-api-key", apiKey);
                req.setHeader("authorization", `Bearer ${apiKey}`);
              }
            };
            proxy.on("proxyReq", attach);
            proxy.on("proxyReqWs", attach);
          },
        },
      },
    },
  });
});
