import { Box, Text } from "ink";

export interface ErrorMessageProps {
  error: Error;
  hint?: string;
}

export function ErrorMessage({
  error,
  hint = "Press r to retry.",
}: ErrorMessageProps) {
  return (
    <Box flexDirection="column">
      <Text bold color="red">
        Something went wrong: {error.message}
      </Text>
      <Text dimColor>{hint}</Text>
    </Box>
  );
}
