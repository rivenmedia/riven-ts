import { preview } from "#.storybook/preview.tsx";

import { PageShell } from "./page-shell.tsx";

const meta = preview.meta({
  title: "Components / PageShell",
  component: PageShell,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    children: (
      <>
        <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
        <p className="text-muted-foreground">
          Consistent page padding, max-width, and enter transition wrap around
          this content.
        </p>
      </>
    ),
  },
});

export const Default = meta.story();
