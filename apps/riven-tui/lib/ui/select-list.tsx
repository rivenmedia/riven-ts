import { Box, Text, useInput } from "ink";
import { useState } from "react";

import { useScrollAreaContext } from "./scroll-area/scroll-area-context.tsx";

import type { ReactNode } from "react";

export interface SelectListProps<T> {
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T, isSelected: boolean, index: number) => ReactNode;
  onSelect: (item: T) => void;
  onCancel?: (() => void) | undefined;
  isActive?: boolean;
  emptyMessage?: string;
  loop?: boolean;
}

export function SelectList<T>({
  items,
  getKey,
  renderItem,
  onSelect,
  onCancel,
  isActive = true,
  emptyMessage = "Nothing to show.",
  loop = false,
}: SelectListProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const lastIndex = items.length - 1;
  const clampedIndex = Math.min(
    Math.max(selectedIndex, 0),
    Math.max(lastIndex, 0),
  );
  const scrollAreaContext = useScrollAreaContext();

  useInput(
    (input, key) => {
      if (items.length === 0) {
        if (key.escape) {
          onCancel?.();
        }

        return;
      }

      if (key.upArrow || input.toLowerCase() === "k") {
        setSelectedIndex((current) => {
          const jumpCount = key.shift ? (scrollAreaContext?.height ?? 1) : 1;
          const nextIndex =
            current <= 0 ? (loop ? lastIndex : 0) : current - jumpCount;

          return Math.max(0, Math.min(nextIndex, lastIndex));
        });

        return;
      }

      if (key.downArrow || input.toLowerCase() === "j") {
        setSelectedIndex((current) => {
          const jumpCount = key.shift ? (scrollAreaContext?.height ?? 1) : 1;
          const nextIndex =
            current >= lastIndex ? (loop ? 0 : lastIndex) : current + jumpCount;

          return Math.max(0, Math.min(nextIndex, lastIndex));
        });

        return;
      }

      if (key.return) {
        const item = items[clampedIndex];

        if (item) {
          onSelect(item);
        }

        return;
      }

      if (key.escape) {
        onCancel?.();
      }
    },
    { isActive },
  );

  if (items.length === 0) {
    return (
      <Box>
        <Text dimColor>{emptyMessage}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={getKey(item)}>
          {renderItem(item, index === clampedIndex, index)}
        </Box>
      ))}
    </Box>
  );
}
