import { Text } from "ink";

import type { TextProps } from "ink";
import type { ReactNode } from "react";

export interface ActionResultMessageProps {
  type: "success" | "warning" | "error";
  message: ReactNode;
}

type ActionResultType = "success" | "warning" | "error";

const colorMap = {
  success: "green",
  warning: "yellow",
  error: "red",
} as const satisfies Record<ActionResultType, TextProps["color"]>;

export function ActionResultMessage({
  type,
  message,
}: ActionResultMessageProps) {
  return <Text color={colorMap[type]}>{message}</Text>;
}
