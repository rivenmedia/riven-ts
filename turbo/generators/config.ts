import type { PlopTypes } from "@turbo/gen";

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
        name: "package-type",
        message: "Select the package type:",
        choices: ["util", "service", "data-access"],
      },
      {
        type: "confirm",
        name: "confirm",
        message: (data) =>
          `This will create @repo/${data["package-type"]}-${data["package-name"]} in packages/${data["package-type"]}-${data["package-name"]}. Continue?`,
        default: true,
      },
    ],
    actions: [
      {
        skip: (data) => {
          if (!data.confirm) {
            return "Package creation cancelled.";
          }
        },
        type: "addMany",
        base: "templates/package",
        destination: "packages/{{package-type}}-{{dashCase package-name}}",
        templateFiles: "templates/package/**",
      },
    ],
  });
}
