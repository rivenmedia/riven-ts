import Image from "next/image";

import { preview } from "#.storybook/preview.tsx";
import { BackdropBackground } from "#components/media/backdrop-background/backdrop-background.tsx";

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

export const Zinc = meta.story({
  args: {
    image: (
      <Image
        alt="backdrop"
        className="h-full w-full object-cover opacity-30 blur-3xl"
        src="https://image.tmdb.org/t/p/original/1CIaRYKf3zg2Xyce1CSfCMg2Vfw.jpg"
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
        src="https://image.tmdb.org/t/p/original/1CIaRYKf3zg2Xyce1CSfCMg2Vfw.jpg"
        fill
      />
    ),
  },
});
