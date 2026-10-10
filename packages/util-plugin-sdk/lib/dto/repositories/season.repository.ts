import { MediaItemRepository } from "./media-item.repository.ts";

import type { Season } from "#dto/entities/index.ts";

export class SeasonRepository extends MediaItemRepository<Season> {}
