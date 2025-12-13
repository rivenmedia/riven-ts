import { ChildEntity, Column, OneToMany, type Relation } from "typeorm";
import { MediaItem } from "./media-item.entity";
import { Season } from "./season.entity";

class SeriesReleaseData {}

@ChildEntity()
export class Show extends MediaItem {
  @Column()
  tvdbStatus?: string;

  @Column("json")
  releaseData: SeriesReleaseData;

  @OneToMany(() => Season, (season) => season.parent)
  seasons: Relation<Season>[];
}
