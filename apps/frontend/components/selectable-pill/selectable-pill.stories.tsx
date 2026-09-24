import { createFormDecorator } from "@/.storybook/decorators/create-form-decorator";
import { preview } from "@/.storybook/preview";

import { expect, fn, userEvent } from "storybook/test";

import { SelectablePill } from "./selectable-pill";

const meta = preview.meta({
  title: "Components / SelectablePill",
  component: SelectablePill,
  args: {
    label: "Movies",
    name: "genres",
    value: "movies",
    onChange: fn(),
  },
  decorators: [
    createFormDecorator({
      defaultValues: {
        genres: {
          movies: false,
        },
      },
    }),
  ],
});

export const Default = meta.story();

Default.test("Toggles the checked state when pressed", async ({ canvas }) => {
  const pill = await canvas.findByRole("checkbox", { name: /movies/iu });

  await userEvent.click(pill);

  await expect(pill).toBeChecked();

  await userEvent.click(pill);

  await expect(pill).not.toBeChecked();
});
