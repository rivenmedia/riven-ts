import prettierConfig from "eslint-config-prettier/flat";
import { defineConfig } from "eslint/config";

export const prettier = defineConfig({
  name: "riven:prettier",
  extends: [prettierConfig],
});
