import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import type { MediaItem } from "../media-items/media-item.entity";

@Entity()
@TableInheritance({
  column: {
    type: "varchar",
    name: "type",
    enum: ["media", "subtitle"],
  },
})
export class FileSystemEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: "media" | "subtitle";

  @Column({ default: 0 })
  fileSize: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  availableInVFS: boolean;

  @ManyToOne("MediaItem", (item: MediaItem) => item.id)
  mediaItem: Relation<MediaItem>;
}
