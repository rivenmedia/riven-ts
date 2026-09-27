// oxlint-disable-next-line import/no-unassigned-import
import "zod";

declare module "zod" {
  interface GlobalMeta {
    /**
     * If true, the field will be rendered as a password field in the frontend settings
     */
    secret?: boolean;
  }
}
