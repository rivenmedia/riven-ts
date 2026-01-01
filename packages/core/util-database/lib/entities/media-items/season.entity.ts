import { Min } from "class-validator";
import {
  ChildEntity,
  Column,
  ManyToOne,
  OneToMany,
  type Relation,
} from "typeorm";

import { Episode } from "./episode.entity.ts";
import { MediaItem } from "./media-item.entity.ts";
import { Show } from "./show.entity.ts";

@ChildEntity()
export class Season extends MediaItem {
  @Column()
  @Min(1)
  number!: number;

  @ManyToOne(() => Show, (show) => show.seasons)
  parent!: Relation<Show>;

  @OneToMany(() => Episode, (episode) => episode.season)
  episodes!: Relation<Episode>[];
}
