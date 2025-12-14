import { MediaItem } from "./media-item.entity.ts";
import { ChildEntity } from "typeorm";

@ChildEntity()
export class Movie extends MediaItem {}
