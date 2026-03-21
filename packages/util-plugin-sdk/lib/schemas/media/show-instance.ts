import z from "zod";

import { Show } from "../../dto/entities/media-items/show.entity.ts";

export const ShowInstance = z.instanceof(Show);
