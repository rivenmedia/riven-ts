import "msw-storybook-addon/types";

declare global {
  interface ImportMetaEnv {
    /** Defined by vitest.config.ts */
    readonly CI?: string;
  }
}
