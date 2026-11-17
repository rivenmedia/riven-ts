import type { GetItemCastQuery } from "./_components/item-cast/_queries/get-item-cast.query.typegen.ts";
import type { GetItemRecommendationsQuery } from "./_components/item-recommendations/_queries/get-item-recommendations.query.typegen.ts";
import type { GetSimilarItemsQuery } from "./_components/similar-items/_queries/get-similar-items.query.typegen.ts";
import type { MediaDetailsPage } from "./page.client.tsx";
import type { ComponentProps } from "react";

type MediaDetailsData = ComponentProps<typeof MediaDetailsPage>["data"];
type Cast = NonNullable<GetItemCastQuery["tmdbItem"]["cast"]>;
type Recommendations =
  GetItemRecommendationsQuery["tmdbItem"]["recommendations"];
type SimilarItems = GetSimilarItemsQuery["tmdbItem"]["similarItems"];

/** A movie that hasn't been requested */
export const unrequestedMovie: MediaDetailsData = {
  id: "unrequested-movie",
  isRequestable: true,
  title: "It",
  overview:
    "In a small town in Maine, seven children known as The Losers Club come face to face with life problems, bullies and a monster that takes the shape of a clown called Pennywise.",
  backdropUrl:
    "https://image.tmdb.org/t/p/original/qVGpxnjrGlHaSTCqTQI6viBDSfp.jpg",
  logo: {
    __typename: "ItemImage",
    aspectRatio: 1.22,
    height: 407,
    width: 500,
    url: "https://image.tmdb.org/t/p/w500/nxUlI9IPiieWnzHviapG0akZkz8.png",
  },
  posterUrl: "https://image.tmdb.org/t/p/w300/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg",
  trailer: {
    __typename: "Trailer",
    id: "trailer-1",
    name: "Trailer 1",
    site: "YouTube",
    key: "abcd1234",
    url: "https://www.youtube.com/watch?v=abcd1234",
  },
  year: 2017,
  runtime: "150 minutes",
  language: "en",
  certification: "R",
  type: "movie",
  genres: [
    {
      __typename: "Genre",
      id: "27",
      name: "Horror",
    },
    {
      __typename: "Genre",
      id: "53",
      name: "Thriller",
    },
    {
      __typename: "Genre",
      id: "18",
      name: "Drama",
    },
  ],
  ratings: {},
  status: "released",
  budget: 35_000_000,
  revenue: 719_766_009,
  productionCompanies: [
    {
      __typename: "ProductionCompany",
      id: "12",
      logoPath: "/2ycs64eqV5rqKYHyQK0GVoKGvfX.png",
      name: "New Line Cinema",
      originCountry: "US",
    },
    {
      __typename: "ProductionCompany",
      id: "829",
      logoPath: "/iJo9zP5QCKyBsmKSOcvXd6UDNih.png",
      name: "Vertigo Entertainment",
      originCountry: "US",
    },
    {
      __typename: "ProductionCompany",
      id: "2723",
      logoPath: "/rB0dyszYRRR3SAG1tfNRzXoYDYq.png",
      name: "Lin Pictures",
      originCountry: "US",
    },
    {
      __typename: "ProductionCompany",
      id: "87671",
      logoPath: "/kEEGB5Z2XLYeR3AMt3Qds7vMnvM.png",
      name: "KatzSmith Productions",
      originCountry: "US",
    },
  ],
  homepage: "https://example.com",
  imdbId: "tt1234567",
  originCountry: ["US"],
  spokenLanguages: [
    {
      __typename: "SpokenLanguage",
      englishName: "English",
      iso6391Code: "en",
      name: "English",
    },
  ],
  mediaItem: null,
};

/** A show that hasn't been requested */
export const unrequestedShow: MediaDetailsData = {
  id: "unrequested-show",
  isRequestable: true,
  title: "Arcane",
  overview:
    "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and clashing convictions.",
  backdropUrl:
    "https://image.tmdb.org/t/p/original/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
  logo: null,
  posterUrl: "https://image.tmdb.org/t/p/w300/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
  trailer: {
    __typename: "Trailer",
    id: "trailer-1",
    name: "Trailer 1",
    site: "YouTube",
    key: "abcd1234",
    url: "https://www.youtube.com/watch?v=abcd1234",
  },
  year: 2021,
  runtime: "",
  language: "en",
  certification: "R",
  type: "show",
  genres: [
    {
      __typename: "Genre",
      id: "10759",
      name: "Action",
    },
  ],
  ratings: {},
  status: "released",
  budget: 35_000_000,
  revenue: 719_766_009,
  productionCompanies: [
    {
      __typename: "ProductionCompany",
      id: "12",
      logoPath: "/2ycs64eqV5rqKYHyQK0GVoKGvfX.png",
      name: "New Line Cinema",
      originCountry: "US",
    },
    {
      __typename: "ProductionCompany",
      id: "829",
      logoPath: "/iJo9zP5QCKyBsmKSOcvXd6UDNih.png",
      name: "Vertigo Entertainment",
      originCountry: "US",
    },
    {
      __typename: "ProductionCompany",
      id: "2723",
      logoPath: "/rB0dyszYRRR3SAG1tfNRzXoYDYq.png",
      name: "Lin Pictures",
      originCountry: "US",
    },
    {
      __typename: "ProductionCompany",
      id: "87671",
      logoPath: "/kEEGB5Z2XLYeR3AMt3Qds7vMnvM.png",
      name: "KatzSmith Productions",
      originCountry: "US",
    },
  ],
  homepage: "https://example.com",
  imdbId: "tt1234567",
  originCountry: ["US"],
  spokenLanguages: [
    {
      __typename: "SpokenLanguage",
      englishName: "English",
      iso6391Code: "en",
      name: "English",
    },
  ],
  mediaItem: null,
};

export const movieCast: Cast = [
  {
    __typename: "CastMember",
    character: "Bill Denbrough",
    id: "1",
    name: "Jaeden Martell",
    profileUrl:
      "https://image.tmdb.org/t/p/w185/oR7ZJsOHMNFzM1HeugV4a4qCMSF.jpg",
  },
];

export const movieRecommendations: Recommendations = [
  {
    __typename: "TmdbIndexerData",
    id: "clown-in-a-cornfield",
    title: "Clown in a Cornfield",
    posterUrl:
      "https://image.tmdb.org/t/p/w300/6ep6gw90TJ8bYvJC6hEDo8SxjoJ.jpg",
    type: "movie",
    year: 2023,
    isRequestable: true,
  },
];

export const movieSimilarItems: SimilarItems = [
  {
    __typename: "TmdbIndexerData",
    id: "it-chapter-2",
    title: "It Chapter 2",
    posterUrl:
      "https://image.tmdb.org/t/p/w300/zfE0R94v1E8cuKAerbskfD3VfUt.jpg",
    type: "movie",
    year: 2019,
    isRequestable: true,
  },
];

export const showCast: Cast = [
  {
    __typename: "CastMember",
    character: "Jinx",
    name: "Ella Purnell",
    id: "cast-1",
    profileUrl:
      "https://artworks.thetvdb.com/banners/v4/actor/599610/photo/673af66279aeb.jpg",
  },
  {
    __typename: "CastMember",
    character: "Vi",
    name: "Hailee Steinfeld",
    id: "cast-2",
    profileUrl:
      "https://artworks.thetvdb.com/banners/v4/actor/327453/photo/673b757403cbb.jpg",
  },
];
