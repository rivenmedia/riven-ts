import { baseLogger } from "../utilities/logger/logger.ts";

export const logger = baseLogger.child({ "riven.log.source": "vfs" });
