import { preview } from "@/.storybook/preview";

import Image from "next/image";

import { BackdropBackground } from "./backdrop-background";

const meta = preview.meta({
  title: "Media / BackdropBackground",
  component: BackdropBackground,
  decorators: [
    (Story) => (
      <div className="relative flex min-h-screen flex-col overflow-x-hidden">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
});

const sampleImage =
  "https://image.tmdb.org/t/p/original/1CIaRYKf3zg2Xyce1CSfCMg2Vfw.jpg";

export const Zinc = meta.story({
  args: {
    image: (
      <Image
        alt="backdrop"
        className="h-full w-full object-cover opacity-30 blur-3xl"
        src={sampleImage}
        fill
      />
    ),
  },
});

export const Background = meta.story({
  args: {
    tone: "background",
    image: (
      <Image
        alt="backdrop"
        className="h-full w-full object-cover opacity-30 blur-3xl"
        src={sampleImage}
        fill
      />
    ),
  },
});
