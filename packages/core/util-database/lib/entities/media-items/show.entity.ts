import { ChildEntity, Column, OneToMany, type Relation } from "typeorm";

import { MediaItem } from "./media-item.entity.ts";
import { Season } from "./season.entity.ts";

@ChildEntity()
export class Show extends MediaItem {
  @Column({ nullable: true })
  tvdbStatus?: string;

  @Column("json")
  releaseData!: object;

  @OneToMany(() => Season, (season) => season.parent, { nullable: true })
  seasons?: Relation<Season>[];
}
