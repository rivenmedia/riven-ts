type ScrollAreaAction =
  | { type: "SET_INNER_HEIGHT"; innerHeight: number }
  | { type: "SET_HEIGHT"; height: number }
  | { type: "SCROLL_DOWN" }
  | { type: "SCROLL_UP" };

interface ScrollAreaState {
  innerHeight: number;
  height: number;
  scrollTop: number;
}

export const scrollAreaReducer = (
  state: ScrollAreaState,
  action: ScrollAreaAction,
): ScrollAreaState => {
  switch (action.type) {
    case "SET_INNER_HEIGHT": {
      return {
        ...state,
        innerHeight: action.innerHeight,
      };
    }
    case "SET_HEIGHT": {
      return {
        ...state,
        height: action.height,
      };
    }

    case "SCROLL_DOWN": {
      return {
        ...state,
        scrollTop: Math.min(
          state.innerHeight <= state.height
            ? 0
            : state.innerHeight - state.height,
          state.scrollTop + 1,
        ),
      };
    }

    case "SCROLL_UP": {
      return {
        ...state,
        scrollTop: Math.max(0, state.scrollTop - 1),
      };
    }

    default: {
      return state;
    }
  }
};
