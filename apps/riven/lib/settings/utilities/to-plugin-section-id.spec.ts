import { expect, it } from "vitest";

import { toPluginSectionId } from "./to-plugin-section-id.ts";

it.for([
  { packageName: "@repo/plugin-comet", sectionId: "repo-plugin-comet" },
  {
    packageName: "@scope/riven-plugin-foo.bar",
    sectionId: "scope-riven-plugin-foo-bar",
  },
])("converts $packageName to $sectionId", ({ packageName, sectionId }) => {
  expect(toPluginSectionId(packageName)).toBe(sectionId);
});
