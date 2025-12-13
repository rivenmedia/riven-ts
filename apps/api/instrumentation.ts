import { Movie } from "@repo/database/entities/media-items/movie.entity";
import "reflect-metadata";

export async function register() {
  const { postgresDataSource } = await import("@repo/database/connection");

  const db = await postgresDataSource.initialize();

  const movie = new Movie();

  movie.title = "Inception";
  movie.imdbId = "tt1375666";

  await db.manager.save(movie);
}
