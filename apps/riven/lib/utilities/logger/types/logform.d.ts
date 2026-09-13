import type { LogLevel } from "../log-levels.ts";

interface CustomLogMeta {
  "riven.error.validation-message": string;
}

declare module "logform" {
  export interface TransformableInfo extends CustomLogMeta {
    "@timestamp": string;
    "log.level": LogLevel;
    "ecs.version": string;
    error?: {
      name?: string;
      message: string;
      type: string;
      stack_trace: string;
    };
  }
}
