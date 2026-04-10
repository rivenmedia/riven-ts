import z from "zod";

import type { Movie } from "../../dto/entities/index.ts";
import type { EntityData } from "@mikro-orm/core";

export const MovieInstance = z.custom<EntityData<Movie>>();

export type MovieInstance = z.infer<typeof MovieInstance>;
