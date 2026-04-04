import { type } from "arktype";

import { Movie } from "../../dto/entities/media-items/movie.entity.ts";

export const MovieInstance = type.instanceOf(Movie);

export type MovieInstance = typeof MovieInstance.infer;
