import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LoaderCircle } from "lucide-react";
import { type ComponentProps, useState } from "react";

interface ActionButtonProps extends Pick<
  ComponentProps<typeof Button>,
  "variant"
> {
  label: string;
  icon: React.ComponentType<React.HTMLAttributes<SVGElement>>;
  action: () => Promise<void>;
}

export function ActionButton({
  icon: Icon,
  label,
  action,
  variant = "ghost",
}: ActionButtonProps) {
  const [actionInProgress, setActionInProgress] = useState(false);

  function handleOnClick() {
    if (actionInProgress) {
      return;
    }

    setActionInProgress(true);

    void action().finally(() => {
      setActionInProgress(false);
    });
  }

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={actionInProgress}
      onClick={handleOnClick}
      className={cn(
        "h-9 gap-2 rounded-xl px-3 transition-all",
        variant === "destructive"
          ? "hover:bg-red-500/20 hover:text-red-400"
          : "hover:bg-white/10",
      )}
    >
      {actionInProgress ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  );
}
