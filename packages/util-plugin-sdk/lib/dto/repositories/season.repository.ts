import { MediaItemRepository } from "./media-item.repository.ts";

import type { Season } from "../entities/index.ts";

export class SeasonRepository extends MediaItemRepository<Season> {}
