import { Button } from "#components/_ui/button.tsx";

import type { ComponentProps } from "react";

interface TriggerButtonProps extends ComponentProps<typeof Button> {
  label: string;
}

export function TriggerButton({ label, ...props }: TriggerButtonProps) {
  return (
    <Button
      type="button"
      size="default"
      variant="default"
      className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary border bg-transparent px-4"
      {...props}
    >
      {label}
    </Button>
  );
}
