import { Box, useFocus, useInput, useBoxMetrics } from "ink";
import { useEffect, useReducer, useRef } from "react";
import { useLocation } from "react-router";

import { useActionsMenuContext } from "../actions-menu/actions-menu-context.tsx";
import { ScrollAreaProvider } from "./scroll-area-context.tsx";
import { scrollAreaReducer } from "./scroll-area.reducer.ts";

import type { DOMElement } from "ink";
import type { PropsWithChildren } from "react";

interface ScrollAreaProps {
  id: string;
}

export function ScrollArea({
  id,
  children,
}: PropsWithChildren<ScrollAreaProps>) {
  useFocus();

  const { pathname } = useLocation();
  const outerRef = useRef<DOMElement>(null);
  const innerRef = useRef<DOMElement>(null);

  const { height: outerHeight } = useBoxMetrics(outerRef);
  const { height: innerHeight } = useBoxMetrics(innerRef);

  const [state, dispatch] = useReducer(scrollAreaReducer, {
    height: outerHeight,
    scrollTop: 0,
    innerHeight: 0,
  });

  const { isVisible: isActionsMenuVisible } = useActionsMenuContext();

  useEffect(() => {
    dispatch({ type: "SET_HEIGHT", height: outerHeight });
  }, [outerHeight]);

  useEffect(() => {
    dispatch({ type: "RESET_SCROLL_POSITION" });
  }, [pathname]);

  useEffect(() => {
    dispatch({
      type: "SET_INNER_HEIGHT",
      innerHeight,
    });
  }, [innerHeight]);

  useInput(
    (_input, key) => {
      if (key.downArrow) {
        dispatch({
          type: key.shift ? "PAGE_DOWN" : "SCROLL_DOWN",
        });
      }

      if (key.upArrow) {
        dispatch({
          type: key.shift ? "PAGE_UP" : "SCROLL_UP",
        });
      }
    },
    { isActive: !isActionsMenuVisible },
  );

  return (
    <ScrollAreaProvider context={state}>
      <Box
        key={`scroll-area-${id}`}
        ref={outerRef}
        height={outerHeight}
        flexDirection="column"
        flexGrow={1}
        overflow="hidden"
      >
        <Box
          ref={innerRef}
          flexShrink={0}
          flexDirection="column"
          marginTop={-state.scrollTop}
        >
          {children}
        </Box>
      </Box>
    </ScrollAreaProvider>
  );
}
