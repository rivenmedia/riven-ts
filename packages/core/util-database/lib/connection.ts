import {
  Episode,
  FileSystemEntry,
  MediaEntry,
  MediaItem,
  Movie,
  RequestedItem,
  Season,
  Show,
  Stream,
  SubtitleEntry,
} from "@repo/util-plugin-sdk/dto/entities/index";

import { DataSource } from "typeorm";
import { z } from "zod";

const entities = [
  SubtitleEntry,
  FileSystemEntry,
  MediaEntry,
  MediaItem,
  Episode,
  Movie,
  Season,
  Show,
  RequestedItem,
  Stream,
];

export const postgresDataSource = new DataSource({
  url: z.string().parse(process.env["DATABASE_URL"]),
  type: "postgres",
  synchronize: true,
  // logging: process.env["NODE_ENV"] !== "test",
  entities,
});
