import { Box, Text } from "ink";

import type { ReactNode } from "react";

export interface DetailRowProps {
  label: string;
  value: ReactNode;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <Box>
      <Box width={18}>
        <Text dimColor>{label}</Text>
      </Box>
      {typeof value === "string" ? <Text>{value}</Text> : value}
    </Box>
  );
}
