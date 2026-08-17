import { Box, Newline, Text, useInput } from "ink";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { LoadingIndicator } from "./loading-indicator.tsx";

import type { PropsWithChildren } from "react";
import type { ErrorBoundaryProps, FallbackProps } from "react-error-boundary";

const DefaultErrorComponent = (
  onBack: () => void,
  { error, resetErrorBoundary }: FallbackProps,
) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : String(error);
  const cause =
    error instanceof Error && error.cause instanceof Error
      ? error.cause
      : undefined;

  useInput((input, key) => {
    if (input.toLowerCase() === "r") {
      resetErrorBoundary();
    }

    if (key.escape) {
      onBack();
      resetErrorBoundary();
    }
  });

  return (
    <Box flexDirection="column" margin={1}>
      <Box>
        <Text color="red">Error: {message}</Text>
      </Box>
      {cause && (
        <Box marginTop={1}>
          <Text dimColor>
            Cause:
            <Newline />
            {cause.message}
          </Text>
        </Box>
      )}
      {stack && (
        <Box marginTop={1}>
          <Text dimColor>
            Stack:
            <Newline />
            {stack}
          </Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>r retry · esc back</Text>
      </Box>
    </Box>
  );
};

export interface SuspenseBoundaryProps {
  onBack?: () => void;
  loadingMessage?: string;
  errorMessage?: NonNullable<ErrorBoundaryProps["fallbackRender"]>;
}

export function SuspenseBoundary({
  children,
  onBack,
  errorMessage = DefaultErrorComponent.bind(
    null,
    onBack ??
      (() => {
        /* empty */
      }),
  ),
  loadingMessage = "Loading",
}: PropsWithChildren<SuspenseBoundaryProps>) {
  return (
    <ErrorBoundary FallbackComponent={errorMessage}>
      <Suspense fallback={<LoadingIndicator label={loadingMessage} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
