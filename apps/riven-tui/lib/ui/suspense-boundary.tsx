import { Box, Text, useInput } from "ink";
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

  useInput((input, key) => {
    if (input === "r") {
      resetErrorBoundary();
    }

    if (key.escape) {
      onBack();
      resetErrorBoundary();
    }
  });

  return (
    <>
      <Box>
        <Text color="red">Error: {message}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>r retry · esc back</Text>
      </Box>
    </>
  );
};

export interface SuspenseBoundaryProps {
  onBack: () => void;
  loadingMessage?: string;
  errorMessage?: NonNullable<ErrorBoundaryProps["fallbackRender"]>;
}

export function SuspenseBoundary({
  children,
  onBack,
  errorMessage = DefaultErrorComponent.bind(null, onBack),
  loadingMessage = "Loading",
}: PropsWithChildren<SuspenseBoundaryProps>) {
  return (
    <ErrorBoundary FallbackComponent={errorMessage}>
      <Suspense
        fallback={
          <Box margin={1}>
            <LoadingIndicator label={loadingMessage} />
          </Box>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
