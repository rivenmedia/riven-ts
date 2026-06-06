import { $ } from "execa";

export const formatOutputCode = async (files: string[]) => {
  const { exitCode } = await $`pnpm prettier --write ${files.join(" ")}`;

  if (exitCode && exitCode !== 0) {
    throw new Error(`Prettier process exited with code ${exitCode}`);
  }

  return "Prettier formatting complete.";
};
