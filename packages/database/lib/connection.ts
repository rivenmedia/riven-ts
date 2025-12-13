"use server";

import "reflect-metadata";
import "server-only";
import { DataSource } from "typeorm";
import { FileSystemEntry } from "./entities/filesystem/filesystem-entry.entity";
import { MediaEntry } from "./entities/filesystem/media-entry.entity";
import { SubtitleEntry } from "./entities/filesystem/subtitle-entry.entity";
import { Episode } from "./entities/media-items/episode.entity";
import { MediaItem } from "./entities/media-items/media-item.entity";
import { Movie } from "./entities/media-items/movie.entity";
import { Season } from "./entities/media-items/season.entity";
import { Show } from "./entities/media-items/show.entity";
import { Stream } from "./entities/streams/stream.entity";
import { UndeterminedItem } from "./entities/media-items/undetermined-item.entity";

const entities = [
  FileSystemEntry,
  MediaEntry,
  SubtitleEntry,
  MediaItem,
  Episode,
  Movie,
  Season,
  Show,
  UndeterminedItem,
  Stream,
];

export const postgresDataSource = new DataSource({
  url: process.env.DATABASE_URL,
  type: "postgres",
  synchronize: true,
  logging: true,
  entities,
});
