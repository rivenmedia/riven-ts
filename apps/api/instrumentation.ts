import { MediaItemState } from "@repo/database/entities/media-items/media-item.entity";
import { Movie } from "@repo/database/entities/media-items/movie.entity";
import "reflect-metadata";

export async function register() {
  const { postgresDataSource } = await import("@repo/database/connection");

  await postgresDataSource.initialize();
}
