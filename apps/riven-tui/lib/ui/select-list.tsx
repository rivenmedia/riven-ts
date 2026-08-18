import { Box, Text, useInput } from "ink";
import { useState } from "react";

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
          if (current <= 0) {
            return loop ? lastIndex : 0;
          }

          return current - 1;
        });

        return;
      }

      if (key.downArrow || input.toLowerCase() === "j") {
        setSelectedIndex((current) => {
          if (current >= lastIndex) {
            return loop ? 0 : lastIndex;
          }

          return current + 1;
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
