import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

import packageJson from "./package.json" with { type: "json" };

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.BACKEND_URL ?? "http://localhost:8080";
  const apiKey = env.BACKEND_API_KEY ?? env.RIVEN_SETTING__API_KEY ?? "";

  return {
    plugins: [tailwindcss(), sveltekit()],
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
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
  };
});
