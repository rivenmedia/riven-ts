import { ChildEntity } from "typeorm";
import { MediaItem } from "./media-item.entity";

@ChildEntity()
export class UndeterminedItem extends MediaItem {}
