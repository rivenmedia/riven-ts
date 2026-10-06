import { toast } from "sonner";

import { preview } from "#.storybook/preview.tsx";
import { Button } from "#components/_ui/button.tsx";

import { Toaster } from "./toaster.tsx";

const meta = preview.meta({
  title: "Components / Toaster",
  component: Toaster,
  parameters: {
    screenshot: {
      skip: true,
    },
  },
});

export const Default = meta.story({
  render: () => (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => toast("Event has been created")}
          type="button"
        >
          Default
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success("Item saved successfully")}
          type="button"
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error("Something went wrong")}
          type="button"
        >
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.info("A new version is available")}
          type="button"
        >
          Info
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.warning("Your session is expiring")}
          type="button"
        >
          Warning
        </Button>
      </div>
    </div>
  ),
});
