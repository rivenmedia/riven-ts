import { Check, Palette } from "lucide-react";
import { useTheme } from "next-themes";

import { themes } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Change Theme">
              <Palette />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Switch theme</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        side="right"
        align="end"
        className="rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/50 backdrop-blur-2xl"
      >
        <DropdownMenuGroup className="space-y-1 p-2">
          <DropdownMenuLabel>Themes</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(themes).map(([key, name]) => (
            <DropdownMenuItem
              key={key}
              className={cn(
                "flex items-center justify-between",
                theme === key
                  ? "bg-accent/80 hover:bg-accent/90"
                  : "hover:bg-accent/80",
              )}
              onClick={() => {
                setTheme(key);
              }}
            >
              <span>{name}</span>
              {theme === key && <Check className="ml-2 size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
