import z from "zod";

import type { ItemRequest as ItemRequestEntity } from "../../dto/entities/index.ts";
import type { EntityData } from "@mikro-orm/core";

export const ItemRequestInstance = z.custom<EntityData<ItemRequestEntity>>();

export type ItemRequestInstance = z.infer<typeof ItemRequestInstance>;
