import { createMDX } from "fumadocs-mdx/next";

import type { NextConfig } from "next";

const withMDX = createMDX();

const config = {
  output: "export",
  images: { unoptimized: true },
} satisfies NextConfig;

export default withMDX(config);
