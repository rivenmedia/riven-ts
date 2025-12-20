import { tsFiles } from "../internal/file-types.ts";
import { flatConfigs as importX } from "eslint-plugin-import-x";
import type { ConfigArray } from "typescript-eslint";

export const importOrdering = [
  importX.recommended,
  {
    files: [tsFiles],
    rules: {
      "import-x/order": [
        "error",
        {
          groups: [
            // Imports of builtins are first
            "builtin",
            // Then sibling and parent imports. They can be mingled together
            ["sibling", "parent"],
            // Then index file imports
            "index",
            // Then any arcane TypeScript imports
            "object",
            // Then the omitted imports: internal, external, type, unknown
          ],
        },
      ],
    },
    settings: {
      "import-x/internal-regex": "^@repo/",
    },
  },
] as const satisfies ConfigArray;
