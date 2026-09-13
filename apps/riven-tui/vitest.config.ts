import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const resolvedBaseConfig = baseVitestConfig({
  command: "serve",
  mode: "test",
});

// `unplugin-swc` derives its JSX transform from `compilerOptions.jsx` in the
// nearest tsconfig, but only ever emits the classic (`React.createElement`)
// runtime - unlike `tsc`, it doesn't map `"jsx": "react-jsx"` to the
// automatic runtime. Ink components rely on the automatic runtime (no
// `React` import in scope), so this package configures its own `unplugin-swc`
// instance instead of the one `baseVitestConfig` provides.
export default defineConfig({
  ...resolvedBaseConfig,
  plugins: [
    swc.vite({
      jsc: {
        transform: {
          react: {
            runtime: "automatic",
          },
        },
      },
    }),
  ],
});
