import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  TableInheritance,
  UpdateDateColumn,
} from "typeorm";

import type { MediaItem } from "../media-items/media-item.entity.ts";

@Entity()
@TableInheritance({
  column: {
    type: "varchar",
    name: "type",
  },
})
export class FileSystemEntry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: 0 })
  fileSize!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column()
  availableInVfs!: boolean;

  @ManyToOne("MediaItem", (item: MediaItem) => item.id)
  mediaItem!: Relation<MediaItem>;
}
