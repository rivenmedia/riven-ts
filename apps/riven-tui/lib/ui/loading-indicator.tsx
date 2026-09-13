import { Text } from "ink";
import Spinner from "ink-spinner";

export interface LoadingIndicatorProps {
  label?: string;
}

export function LoadingIndicator({ label = "Loading" }: LoadingIndicatorProps) {
  return (
    <Text color="cyan">
      <Spinner /> {label}…
    </Text>
  );
}
