import { Providers } from "@/components/providers";

import { render } from "@testing-library/react";

import type { RenderOptions } from "@testing-library/react";

const customRender: (
  ui: React.ReactNode,
  options?: Omit<RenderOptions, "queries" | "wrapper">,
) => ReturnType<typeof render> = (ui, options) =>
  render(ui, { wrapper: Providers, ...options });

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
