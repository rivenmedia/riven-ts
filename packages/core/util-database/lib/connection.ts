import { DataSource } from "typeorm";
import { z } from "zod";

import { FileSystemEntry } from "./entities/filesystem/filesystem-entry.entity.ts";
import { MediaEntry } from "./entities/filesystem/media-entry.entity.ts";
import { SubtitleEntry } from "./entities/filesystem/subtitle-entry.entity.ts";
import { Episode } from "./entities/media-items/episode.entity.ts";
import { MediaItem } from "./entities/media-items/media-item.entity.ts";
import { Movie } from "./entities/media-items/movie.entity.ts";
import { RequestedItemEntity } from "./entities/media-items/requested-item.entity.ts";
import { Season } from "./entities/media-items/season.entity.ts";
import { Show } from "./entities/media-items/show.entity.ts";
import { Stream } from "./entities/streams/stream.entity.ts";

const entities = [
  FileSystemEntry,
  MediaEntry,
  SubtitleEntry,
  MediaItem,
  Episode,
  Movie,
  Season,
  Show,
  RequestedItemEntity,
  Stream,
];

export const postgresDataSource = new DataSource({
  url: z.string().parse(process.env["DATABASE_URL"]),
  type: "postgres",
  synchronize: true,
  // logging: process.env["NODE_ENV"] !== "test",
  entities,
});
