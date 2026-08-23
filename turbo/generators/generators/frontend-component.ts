import { kebabCase } from "es-toolkit";
import path from "node:path";

import { formatOutputCode } from "./actions/format-output.ts";

import type { PlopTypes } from "@turbo/gen";

interface PackageAnswers {
  componentName: string;
  componentGroup: string;
}

function buildComponentPath(componentGroup: string, componentName: string) {
  return path.join(
    "apps/frontend/components",
    componentGroup,
    kebabCase(componentName),
  );
}

export const createFrontendComponentGenerator = (
  plop: PlopTypes.NodePlopAPI,
) => {
  plop.setHelper("frontend-component__buildComponentPath", buildComponentPath);

  return plop.setGenerator("frontend-component", {
    description: "Generate frontend component boilerplate",
    prompts: [
      {
        type: "input",
        name: "componentName",
        message: "Component name (e.g., MyComponent):",
        validate(value: string) {
          if (!value) {
            return "Component name is required.";
          }

          return true;
        },
      },
      {
        type: "input",
        name: "componentGroup",
        message: "Component group (e.g., profile) [optional]:",
        default: "",
      },
      {
        type: "confirm",
        name: "confirm",
        message: (data) => {
          const { componentName, componentGroup } = data as PackageAnswers;
          const componentPath = buildComponentPath(
            componentGroup,
            componentName,
          );

          return `This will create ${componentPath}. Continue?`;
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

          return undefined;
        },
        type: "addMany",
        base: "templates/frontend-component",
        destination:
          "{{frontend-component__buildComponentPath componentGroup componentName}}",
        templateFiles: "templates/frontend-component/**",
      },
      async (answers) => {
        const { componentGroup, componentName } = answers as PackageAnswers;

        return formatOutputCode([
          `${buildComponentPath(componentGroup, componentName)}/**`,
        ]);
      },
    ],
  });
};
