import { preview } from "@/.storybook/preview";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { FilterPopover } from "./filter-popover";

const meta = preview.meta({
  title: "Components / FilterPopover",
  component: FilterPopover,
  args: {
    onApply: fn(),
  },
});

export const Default = meta.story({
  name: "Movie Filters",
  args: {
    mediaType: "movie",
  },
});

Default.test(
  "Updates the applied filter count when filters are applied",
  async ({ canvas, canvasElement }) => {
    let appliedFilterCount = 0;

    const body = within(canvasElement.ownerDocument.body);

    const popoverButton = canvas.getByRole("button", { name: /filters/iu });

    async function assertFilterCount(expectedCount: number) {
      await expect(popoverButton).toHaveAccessibleName(
        new RegExp(`filters ${expectedCount.toString()}`, "iu"),
      );
    }

    await userEvent.click(popoverButton);

    const dialog = within(
      await body.findByRole("dialog", { name: /filters/iu }),
    );

    const releaseDateFromInput = dialog.getByRole("textbox", {
      name: /release date from/iu,
    });

    const releaseDateToInput = dialog.getByRole("textbox", {
      name: /release date to/iu,
    });

    await userEvent.type(releaseDateFromInput, "2020-01-01");
    await userEvent.type(releaseDateToInput, "2020-12-31");

    await assertFilterCount((appliedFilterCount += 1));

    const genreButton = dialog.getByRole("checkbox", { name: /action/iu });

    await userEvent.click(genreButton);

    await assertFilterCount((appliedFilterCount += 1));

    const languageSelect = dialog.getByRole("combobox", {
      name: /language/iu,
    });

    await userEvent.type(languageSelect, "english{Enter}");

    await assertFilterCount((appliedFilterCount += 1));

    const contentRatingButton = dialog.getByRole("checkbox", {
      name: /pg-13/iu,
    });

    await userEvent.click(contentRatingButton);

    await assertFilterCount((appliedFilterCount += 1));

    const sliders = [/runtime/iu, /vote average/iu, /vote count/iu] as const;

    for (const slider of sliders) {
      const sliderElement = within(
        dialog.getByRole("generic", { name: slider }),
      );

      const minimumSliderHandle = sliderElement.getByRole("slider", {
        name: /minimum/iu,
      });

      await userEvent.type(
        minimumSliderHandle,
        "{ArrowRight}{ArrowRight}{ArrowRight}",
      );

      await assertFilterCount((appliedFilterCount += 1));
    }
  },
);

Default.test(
  "Sends the form data to the onApply callback when the Apply button is clicked",
  async ({ canvas, canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);

    const popoverButton = canvas.getByRole("button", { name: /filters/iu });

    await userEvent.click(popoverButton);

    const dialog = within(
      await body.findByRole("dialog", { name: /filters/iu }),
    );

    const releaseDateFromInput = dialog.getByRole("textbox", {
      name: /release date from/iu,
    });

    const releaseDateToInput = dialog.getByRole("textbox", {
      name: /release date to/iu,
    });

    await userEvent.type(releaseDateFromInput, "2020-01-01");
    await userEvent.type(releaseDateToInput, "2020-12-31");

    const applyButton = dialog.getByRole("button", { name: /apply/iu });

    await userEvent.click(applyButton);

    await waitFor(async () => {
      await expect(args.onApply).toHaveBeenCalledWith(
        expect.objectContaining({
          releaseDateFrom: "2020-01-01",
          releaseDateTo: "2020-12-31",
        }),
      );
    });
  },
);

export const ShowFilters = meta.story({
  args: {
    mediaType: "show",
  },
});
