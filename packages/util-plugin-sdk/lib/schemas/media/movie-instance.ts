import z from "zod";

import { Movie } from "../../dto/entities/index.ts";

export const MovieInstance = z.instanceof(Movie);
