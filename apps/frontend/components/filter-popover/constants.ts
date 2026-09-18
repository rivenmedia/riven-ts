export const LANGUAGE_OPTIONS = [
  { value: "", label: "All Languages" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "hi", label: "Hindi" },
  { value: "ru", label: "Russian" },
] as const;

/**
 * Genre definitions for movies and TV shows
 */
export const MOVIE_GENRES = new Map([
  ["Action", 28],
  ["Adventure", 12],
  ["Animation", 16],
  ["Comedy", 35],
  ["Crime", 80],
  ["Documentary", 99],
  ["Drama", 18],
  ["Family", 10_751],
  ["Fantasy", 14],
  ["History", 36],
  ["Horror", 27],
  ["Music", 10_402],
  ["Mystery", 9648],
  ["Romance", 10_749],
  ["Science Fiction", 878],
  ["TV Movie", 10_770],
  ["Thriller", 53],
  ["War", 10_752],
  ["Western", 37],
]);

export const TV_GENRES = new Map([
  ["Action & Adventure", 10_759],
  ["Animation", 16],
  ["Comedy", 35],
  ["Crime", 80],
  ["Documentary", 99],
  ["Drama", 18],
  ["Family", 10_751],
  ["Kids", 10_762],
  ["Mystery", 9648],
  ["News", 10_763],
  ["Reality", 10_764],
  ["Sci-Fi & Fantasy", 10_765],
  ["Soap", 10_766],
  ["Talk", 10_767],
  ["War & Politics", 10_768],
  ["Western", 37],
]);
