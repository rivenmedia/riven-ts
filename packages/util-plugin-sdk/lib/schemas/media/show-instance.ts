import z from "zod";

import { Show } from "../../dto/entities/index.ts";

export const ShowInstance = z.instanceof(Show);

export type ShowInstance = z.infer<typeof ShowInstance>;
