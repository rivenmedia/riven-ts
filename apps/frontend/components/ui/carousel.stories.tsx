import { preview } from "@/.storybook/preview";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { expect, userEvent } from "storybook/test";

/**
 * A carousel with motion and swipe built using Embla.
 */
const meta = preview.meta({
  title: "ui/Carousel",
  component: Carousel,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    className: "w-full max-w-xs",
  },
  render: (args) => (
    <Carousel {...args}>
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="flex aspect-square items-center justify-center rounded border bg-card p-6">
              <span className="font-semibold text-4xl">{index + 1}</span>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
  parameters: {
    layout: "centered",
  },
});

/**
 * The default form of the carousel.
 */
export const Default = meta.story({});

/**
 * Use the `basis` utility class to change the size of the carousel.
 */
export const Size = meta.story({
  render: (args) => (
    <Carousel {...args} className="mx-12 w-full max-w-xs">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index} className="basis-1/3">
            <div className="flex aspect-square items-center justify-center rounded border bg-card p-6">
              <span className="font-semibold text-4xl">{index + 1}</span>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
  args: {
    className: "mx-12 w-full max-w-xs",
  },
});

Default.test(
  "When clicking the next/previous buttons, it navigates through the slides",
  async ({ canvas, step }) => {
    const slides = await canvas.findAllByRole("group");

    await expect(slides).toHaveLength(5);

    const nextBtn = await canvas.findByRole("button", { name: /next/i });
    const prevBtn = await canvas.findByRole("button", {
      name: /previous/i,
    });

    await step("navigate to the last slide", async () => {
      for (let i = 0; i < slides.length - 1; i++) {
        await userEvent.click(nextBtn);
      }
    });

    await step("navigate back to the first slide", async () => {
      for (let i = slides.length - 1; i > 0; i--) {
        await userEvent.click(prevBtn);
      }
    });
  },
);
