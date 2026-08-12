import { PluginCards } from "@/components/plugin-cards";

import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { Step, Steps } from "fumadocs-ui/components/steps";
import defaultMdxComponents from "fumadocs-ui/mdx";

import type { MDXComponents } from "mdx/types";

/**
 * Components available to every MDX file without importing them.
 *
 * Plugin packages contribute their own docs but don't depend on `fumadocs-ui`,
 * so an `import` inside a plugin's `docs` directory would fail to resolve.
 * Registering them here is what makes those pages able to use them.
 */
export const sharedMdxComponents = {
  ...defaultMdxComponents,
  Callout,
  Card,
  Cards,
  PluginCards,
  Step,
  Steps,
} satisfies MDXComponents;

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...sharedMdxComponents,
    ...components,
  };
}
