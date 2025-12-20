import "reflect-metadata";
import { resolve } from "node:path";
import type { NextConfig } from "next";

export default {
  turbopack: {
    root: resolve(__dirname, "../../../.."),
  },
} satisfies NextConfig;
