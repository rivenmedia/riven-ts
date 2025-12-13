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
        type: "",
        name: "package-group",
        message: "Package group (e.g., core):",
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
        skip: (data) => {
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
    ],
  });
}
