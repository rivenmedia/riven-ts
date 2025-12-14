import type { PlopTypes } from "@turbo/gen";
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";

interface PackageAnswers {
  "package-name": string;
  "package-group": string;
  "package-type": string;
  confirm: boolean;
}

const installDependencies: PlopTypes.CustomActionFunction = async (
  _answers,
  _config,
  plop,
) => {
  if (!plop) {
    throw new Error("Plop instance is not available.");
  }

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

const formatOutputCode: PlopTypes.CustomActionFunction = async (
  answers,
  _config,
  plop,
) => {
  if (!plop) {
    throw new Error("Plop instance is not available.");
  }

  const {
    "package-type": packageType,
    "package-name": packageName,
    "package-group": packageGroup,
  } = answers as PackageAnswers;

  return new Promise((resolve, reject) => {
    const child = spawn(
      "pnpm",
      [
        "prettier",
        "--write",
        `packages/${packageGroup}/${packageType}-${packageName}/**/*`,
      ],
      { stdio: "inherit" },
    );

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

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("package", {
    description: "Generate package boilerplate",
    prompts: [
      {
        type: "input",
        name: "package-name",
        message: "Package name (e.g., my-package):",
      },
      {
        type: "list",
        name: "package-group",
        message: "Package group (e.g., core):",
        choices() {
          return readdirSync("packages", { withFileTypes: true })
            .filter(
              (dirent) =>
                dirent.isDirectory() &&
                !existsSync(`packages/${dirent.name}/package.json`),
            )
            .map((dirent) => dirent.name);
        },
      },
      {
        type: "list",
        name: "package-type",
        message: "Select the package type:",
        choices: ["util", "service", "data-access"],
      },
      {
        type: "confirm",
        name: "confirm",
        message: (data) => {
          const {
            "package-type": packageType,
            "package-name": packageName,
            "package-group": packageGroup,
          } = data;

          const packageIdentifier = `@repo/${packageGroup}-${packageType}-${packageName}`;
          const packagePath = `packages/${packageGroup}/${packageType}-${packageName}`;
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
        base: "templates/package",
        destination:
          "packages/{{package-group}}/{{package-type}}-{{kebabCase package-name}}",
        templateFiles: "templates/package/**",
      },
      installDependencies,
      formatOutputCode,
    ],
  });
}
