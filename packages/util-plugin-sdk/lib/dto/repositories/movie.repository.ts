import { MediaItemRepository } from "./media-item.repository.ts";

import type { Movie } from "../entities/index.ts";

export class MovieRepository extends MediaItemRepository<Movie> {}
