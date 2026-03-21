import z from "zod";

import { Movie } from "../../dto/entities/media-items/movie.entity.ts";

export const MovieInstance = z.instanceof(Movie);
