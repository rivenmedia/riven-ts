import { ChildEntity } from "typeorm";

import { MediaItem } from "./media-item.entity.ts";

@ChildEntity()
export class Movie extends MediaItem {}
