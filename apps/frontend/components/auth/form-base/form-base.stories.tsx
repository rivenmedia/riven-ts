import { preview } from "#.storybook/preview.tsx";
import { Button } from "#components/_ui/button.tsx";
import { Input } from "#components/_ui/input.tsx";
import { Label } from "#components/_ui/label.tsx";

import { FormBase } from "./form-base.tsx";

const meta = preview.meta({
  title: "Auth / FormBase",
  component: FormBase,
});

export const Default = meta.story({
  args: {
    title: "Change password",
    description: "Update your account password.",
    content: (
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" type="password" />
      </div>
    ),
    footer: <Button type="submit">Save</Button>,
  },
});

export const NoDescription = meta.story({
  args: {
    title: "Passkeys",
    content: (
      <p className="text-muted-foreground text-sm">
        No passkeys registered yet.
      </p>
    ),
  },
});
