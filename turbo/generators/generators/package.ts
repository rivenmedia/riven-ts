import { existsSync, readdirSync } from "node:fs";
import { installDependenciesAction } from "./actions/install-dependencies";
import { formatOutputCode } from "./actions/format-output";
import type { PlopTypes } from "@turbo/gen";

interface PackageAnswers {
  packageName: string;
  packageType: string;
  confirm: boolean;
}

export const createPackageGenerator = (plop: PlopTypes.NodePlopAPI) =>
  plop.setGenerator("package", {
    description: "Generate package boilerplate",
    prompts: [
      {
        type: "input",
        name: "packageName",
        message: "Package name (e.g., my-package):",
      },
      {
        type: "list",
        name: "packageType",
        message: "Select the package type:",
        choices: ["feature", "util"],
      },
      {
        type: "confirm",
        name: "confirm",
        message: (data) => {
          const { packageType, packageName } = data as PackageAnswers;

          const packageIdentifier = `@repo/${packageType}-${packageName}`;
          const packagePath = `packages/${packageType}-${packageName}`;

          return `This will create ${packageIdentifier} in ${packagePath}. Continue?`;
        },
        default: true,
      },
    ],
    actions: [
      {
        skip: (data: { confirm: boolean }) => {
          if (!data.confirm) {
            return "Package creation cancelled.";
          }
        },
        type: "addMany",
        base: "templates/shared/boilerplate",
        destination: "packages/{{packageType}}-{{kebabCase packageName}}",
        templateFiles: "templates/shared/boilerplate/**",
      },
      {
        skip: (data: { confirm: boolean }) => {
          if (!data.confirm) {
            return "Package creation cancelled.";
          }
        },
        type: "addMany",
        base: "templates/package",
        destination: "packages/{{packageType}}-{{kebabCase packageName}}",
        templateFiles: "templates/package/**",
      },
      installDependenciesAction,
      (answers) => {
        const { packageType, packageName } = answers as PackageAnswers;

        return formatOutputCode([
          `packages/${packageType}-${packageName}/**/*`,
        ]);
      },
    ],
  });
