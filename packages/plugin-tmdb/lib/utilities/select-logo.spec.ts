import { expect, it as baseIt } from "vitest";

import { selectLogo } from "./select-logo.ts";

import type { MediaImage } from "../schemas/media-image.schema.ts";

const it = baseIt.extend(
  "logo",
  () =>
    (name: string, overrides: Partial<MediaImage> = {}): MediaImage => ({
      aspect_ratio: 2,
      height: 250,
      width: 500,
      iso_639_1: "en",
      file_path: `/${name}.png`,
      vote_average: 5,
      vote_count: 10,
      ...overrides,
    }),
);

const select = (
  logos: MediaImage[],
  options: Partial<Parameters<typeof selectLogo>[1]> = {},
) =>
  selectLogo(logos, {
    width: null,
    aspectRatio: null,
    language: "en-GB",
    ...options,
  })?.url;

const urlFor = (name: string) =>
  `https://image.tmdb.org/t/p/original/${name}.png`;

it("returns the highest-rated logo when no dimensions are requested", ({
  logo,
}) => {
  expect(
    select([
      logo("low", { vote_average: 4 }),
      logo("tied-fewer-votes", { vote_average: 8, vote_count: 5 }),
      logo("best", { vote_average: 8, vote_count: 50 }),
    ]),
  ).toBe(urlFor("best"));
});

it("returns the logo's details", ({ logo }) => {
  expect(
    selectLogo([logo("only", { width: 640, height: 320 })], {
      width: null,
      aspectRatio: null,
      language: "en",
    }),
  ).toStrictEqual({
    url: urlFor("only"),
    width: 640,
    height: 320,
    aspectRatio: 2,
  });
});

it("only considers logos in the requested language or without a language", ({
  logo,
}) => {
  const logos = [
    logo("english", { vote_average: 9 }),
    logo("neutral", { iso_639_1: null, vote_average: 3 }),
    logo("french", { iso_639_1: "fr", vote_average: 6 }),
  ];

  expect(select(logos, { language: "fr-FR" })).toBe(urlFor("french"));
  expect(select(logos, { language: "de-DE" })).toBe(urlFor("neutral"));
});

it("returns no logo when none are usable", ({ logo }) => {
  expect(select([logo("german", { iso_639_1: "de" })])).toBeUndefined();
  expect(select([logo("no-file", { file_path: "" })])).toBeUndefined();
  expect(select([])).toBeUndefined();
});

it("returns the logo closest to the requested aspect ratio", ({ logo }) => {
  expect(
    select(
      [
        logo("square", { aspect_ratio: 1, vote_average: 10 }),
        logo("wide", { aspect_ratio: 4 }),
        logo("close", { aspect_ratio: 2.5 }),
      ],
      { aspectRatio: 3 },
    ),
  ).toBe(urlFor("close"));
});

it("prefers the closest logo that does not need upscaling", ({ logo }) => {
  expect(
    select(
      [
        logo("too-small", { width: 490 }),
        logo("closest-large-enough", { width: 600 }),
        logo("much-larger", { width: 1200 }),
      ],
      { width: 500 },
    ),
  ).toBe(urlFor("closest-large-enough"));
});

it("falls back to the closest smaller logo when none are wide enough", ({
  logo,
}) => {
  expect(
    select([logo("tiny", { width: 100 }), logo("closest", { width: 400 })], {
      width: 500,
    }),
  ).toBe(urlFor("closest"));
});

it("breaks aspect ratio ties by width and then by rating", ({ logo }) => {
  const logos = [
    logo("far-width", { aspect_ratio: 2, width: 1000, vote_average: 10 }),
    logo("near-width-low", { aspect_ratio: 2, width: 600, vote_average: 4 }),
    logo("near-width-high", { aspect_ratio: 2, width: 600, vote_average: 7 }),
  ];

  expect(select(logos, { aspectRatio: 2, width: 500 })).toBe(
    urlFor("near-width-high"),
  );
  expect(select(logos, { aspectRatio: 2 })).toBe(urlFor("far-width"));
});
