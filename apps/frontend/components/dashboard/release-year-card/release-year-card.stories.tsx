import { preview } from "@/.storybook/preview";

import { ReleaseYearCard } from "./release-year-card";

const meta = preview.meta({
  title: "Dashboard / ReleaseYearCard",
  component: ReleaseYearCard,
});

export const Default = meta.story({
  args: {
    data: [
      { year: 2012, count: 35 },
      { year: 2013, count: 20 },
      { year: 2014, count: 0 },
      { year: 2015, count: 40 },
      { year: 2016, count: 32 },
      { year: 2017, count: 82 },
      { year: 2018, count: 34 },
      { year: 2019, count: 51 },
      { year: 2020, count: 62 },
      { year: 2021, count: 88 },
      { year: 2022, count: 10 },
      { year: 2023, count: 154 },
      { year: 2024, count: 178 },
      { year: 2025, count: 200 },
    ],
  },
});

export const Empty = meta.story({
  args: {
    data: [],
  },
});
