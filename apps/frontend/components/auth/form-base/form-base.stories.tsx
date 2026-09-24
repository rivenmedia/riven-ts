import { preview } from "@/.storybook/preview";
import { Button } from "@/components/_ui/button";
import { Input } from "@/components/_ui/input";
import { Label } from "@/components/_ui/label";

import { FormBase } from "./form-base";

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
