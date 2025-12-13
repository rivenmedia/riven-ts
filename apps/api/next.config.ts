import "reflect-metadata";
import type { NextConfig } from "next";
import { resolve } from "node:path";

export default {
  turbopack: {
    root: resolve(__dirname, "../../.."),
  },
} satisfies NextConfig;
