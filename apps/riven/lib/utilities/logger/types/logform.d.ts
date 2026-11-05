import type { LogLevel } from "@repo/util-plugin-sdk/dto/enums/log-level.enum";

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
