import z from "zod";

import { ItemRequest } from "../../dto/entities/index.ts";

export const ItemRequestInstance = z.instanceof(ItemRequest);

export type ItemRequestInstance = z.infer<typeof ItemRequestInstance>;
