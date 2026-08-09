import { Text } from "ink";
import { useEffect, useState } from "react";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export interface LoadingIndicatorProps {
  label?: string;
}

export function LoadingIndicator({ label = "Loading" }: LoadingIndicatorProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((current) => (current + 1) % FRAMES.length);
    }, 80);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Text color="cyan">
      {FRAMES[frameIndex]} {label}…
    </Text>
  );
}
