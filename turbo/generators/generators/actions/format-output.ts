import { $ } from "execa";

export const formatOutputCode = async (files: string[]) => {
  const { exitCode } = await $`pnpm oxfmt --write ${files.join(" ")}`;

  if (exitCode && exitCode !== 0) {
    throw new Error(`Oxfmt process exited with code ${exitCode}`);
  }

  return "Oxfmt formatting complete.";
};
