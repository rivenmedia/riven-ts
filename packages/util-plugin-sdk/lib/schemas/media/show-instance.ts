import z from "zod";

import type { Show } from "../../dto/entities/index.ts";
import type { EntityData } from "@mikro-orm/core";

export const ShowInstance = z.custom<EntityData<Show>>();

export type ShowInstance = z.infer<typeof ShowInstance>;
