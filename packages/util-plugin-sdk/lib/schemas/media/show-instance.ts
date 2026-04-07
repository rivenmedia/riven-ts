import z from "zod";

import { Show } from "../../dto/entities/index.ts";

export const ShowInstance = z.instanceof(Show);
