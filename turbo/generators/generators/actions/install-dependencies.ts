import { $ } from "execa";

export const installDependenciesAction: () => Promise<string> = async () => {
  const { exitCode } = await $`pnpm install`;

  if (exitCode && exitCode !== 0) {
    throw new Error(
      `Installation process exited with code ${exitCode.toString()}`,
    );
  }

  return "Dependencies installation complete.";
};
