import { Text } from "ink";

import type { ReactNode } from "react";

export interface SelectableRowProps {
  children: ReactNode;
  isSelected: boolean;
}

export function SelectableRow({ children, isSelected }: SelectableRowProps) {
  if (isSelected) {
    return <Text color="cyan">❯ {children}</Text>;
  }

  return (
    <Text>
      {"  "}
      {children}
    </Text>
  );
}
