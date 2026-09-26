import { Globals, useReducedMotion } from "@react-spring/web";
import { useEffect } from "react";

import type { Decorator } from "@storybook/nextjs-vite";

export const WithReducedMotionCheck: Decorator = (Story) => {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    Globals.assign({ skipAnimation: Boolean(prefersReducedMotion) });

    return () => {
      Globals.assign({ skipAnimation: false });
    };
  }, [prefersReducedMotion]);

  return <Story />;
};
