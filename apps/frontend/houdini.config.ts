/// <references types="houdini-svelte">
import { DateTime } from "luxon";

import type { ConfigFile } from "houdini";

const config = {
  runtimeDir: ".houdini",
  schemaPath: "../riven/schema.graphql",
  plugins: {
    "houdini-svelte": {},
  },
  scalars: {
    DateTimeISO: {
      type: "DateTime",
      module: "luxon",
      unmarshal(val: unknown) {
        if (typeof val !== "string") {
          return null;
        }

        return DateTime.fromISO(val);
      },
      marshal(val) {
        if (val instanceof DateTime) {
          return val.toISO();
        }

        return null;
      },
    },
  },
} satisfies ConfigFile;

export default config;
