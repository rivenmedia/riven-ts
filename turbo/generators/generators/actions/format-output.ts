import { spawn } from "node:child_process";

export const formatOutputCode = (path: string) => {
  return new Promise<string>((resolve, reject) => {
    const child = spawn("pnpm", ["prettier", "--write", `${path}/**/*`], {
      stdio: "inherit",
    });

    child.on("close", (code) =>
      code === 0
        ? resolve("Prettier formatting complete.")
        : reject(new Error(`Prettier process exited with code ${code}`)),
    );

    child.on("error", (err) =>
      reject(new Error(`Prettier encountered an error: ${err.message}`)),
    );
  });
};
