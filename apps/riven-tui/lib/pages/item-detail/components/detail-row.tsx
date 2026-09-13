import { Box, Text } from "ink";

import type { BoxProps } from "ink";
import type { ReactNode } from "react";

export interface DetailRowProps {
  label: string;
  value: ReactNode;
  flexDirection?: BoxProps["flexDirection"];
}

export function DetailRow({
  label,
  value,
  flexDirection = "row",
}: DetailRowProps) {
  return (
    <Box flexDirection={flexDirection}>
      <Box width={18}>
        <Text dimColor>{label}</Text>
      </Box>
      {typeof value === "string" ? <Text>{value}</Text> : value}
    </Box>
  );
}
