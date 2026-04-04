import { type } from "arktype";

import { Show } from "../../dto/entities/media-items/show.entity.ts";

export const ShowInstance = type.instanceOf(Show);

export type ShowInstance = typeof ShowInstance.infer;
