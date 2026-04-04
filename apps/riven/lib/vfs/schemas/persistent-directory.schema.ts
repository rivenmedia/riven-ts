import { type } from "arktype";

export const PersistentDirectory = type.enumerated("movies", "shows");

export type PersistentDirectory = typeof PersistentDirectory.infer;
