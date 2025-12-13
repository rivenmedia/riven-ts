import {
  ChildEntity,
  Column,
  ManyToOne,
  OneToMany,
  type Relation,
} from "typeorm";
import { Min } from "class-validator";
import { MediaItem } from "./media-item.entity";
import { Show } from "./show.entity";
import { Episode } from "./episode.entity";

@ChildEntity()
export class Season extends MediaItem {
  @Column()
  @Min(1)
  number: number;

  @ManyToOne(() => Show, (show) => show.seasons)
  parent: Relation<Show>;

  @OneToMany(() => Episode, (episode) => episode.season)
  episodes: Relation<Episode>[];
}
