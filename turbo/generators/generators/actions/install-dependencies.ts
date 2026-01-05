import { spawn } from "node:child_process";

import type { PlopTypes } from "@turbo/gen";

export const installDependenciesAction: PlopTypes.CustomActionFunction =
  async () => {
    return new Promise((resolve, reject) => {
      const child = spawn("pnpm", ["install"], { stdio: "inherit" });

      child.on("close", (code) =>
        code === 0
          ? resolve("Dependencies installation complete.")
          : reject(new Error(`Installation process exited with code ${code}`)),
      );

      child.on("error", (err) =>
        reject(new Error(`Installation encountered an error: ${err.message}`)),
      );
    });
  };
