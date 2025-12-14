import { MediaItem } from "./media-item.entity.ts";
import { Season } from "./season.entity.ts";
import { ChildEntity, Column, ManyToOne, type Relation } from "typeorm";
import { Min } from "class-validator";

@ChildEntity()
export class Episode extends MediaItem {
  @Column()
  @Min(1)
  number!: number;

  @Column({ nullable: true })
  absoluteNumber?: number;

  @ManyToOne(() => Season, (season) => season.episodes)
  season!: Relation<Season>;
}
