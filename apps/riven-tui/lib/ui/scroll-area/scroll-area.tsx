import { Box, measureElement, useFocus, useInput } from "ink";
import { useEffect, useReducer, useRef } from "react";

import { useActionsMenuContext } from "../actions-menu/actions-menu-context.tsx";
import { scrollAreaReducer } from "./scroll-area.reducer.ts";

import type { DOMElement } from "ink";
import type { PropsWithChildren } from "react";

export function ScrollArea({ children }: PropsWithChildren) {
  useFocus();

  const outerRef = useRef<DOMElement>(null);
  const { height } = outerRef.current
    ? measureElement(outerRef.current)
    : { height: 0 };

  const [state, dispatch] = useReducer(scrollAreaReducer, {
    height,
    scrollTop: 0,
    innerHeight: 0,
  });

  const innerRef = useRef<DOMElement>(null);

  const { isVisible: isActionsMenuVisible } = useActionsMenuContext();

  useEffect(() => {
    dispatch({ type: "SET_HEIGHT", height });
  }, [height]);

  useEffect(() => {
    if (!innerRef.current) {
      return;
    }

    const dimensions = measureElement(innerRef.current);

    dispatch({
      type: "SET_INNER_HEIGHT",
      innerHeight: dimensions.height,
    });
  }, []);

  useInput(
    (_input, key) => {
      if (key.downArrow) {
        dispatch({
          type: "SCROLL_DOWN",
        });
      }

      if (key.upArrow) {
        dispatch({
          type: "SCROLL_UP",
        });
      }
    },
    { isActive: !isActionsMenuVisible },
  );

  return (
    <Box
      ref={outerRef}
      height={height}
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
  );
}
