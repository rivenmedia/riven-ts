import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { PropsWithChildren } from "react";

interface TextEntryContextValue {
  isTextEntryFocused: boolean;
  setTextEntryFocused: (isFocused: boolean) => void;
}

const TextEntryContext = createContext<TextEntryContextValue>({
  isTextEntryFocused: false,
  setTextEntryFocused: () => {
    /* empty */
  },
});

export function TextEntryProvider({ children }: PropsWithChildren) {
  const [textEntryFocused, setTextEntryFocused] = useState(false);

  const value = useMemo(
    () => ({ isTextEntryFocused: textEntryFocused, setTextEntryFocused }),
    [textEntryFocused],
  );

  return (
    <TextEntryContext.Provider value={value}>
      {children}
    </TextEntryContext.Provider>
  );
}

/**
 * Reports whether a text entry field is currently focused, so that global
 * key handlers (e.g. quitting on `q`) can yield to typing.
 */
export function useReportTextEntryFocus(isFocused: boolean) {
  const { setTextEntryFocused } = useContext(TextEntryContext);

  useEffect(() => {
    setTextEntryFocused(isFocused);

    return () => {
      setTextEntryFocused(false);
    };
  }, [isFocused, setTextEntryFocused]);
}

export function useIsTextEntryFocused() {
  return useContext(TextEntryContext).isTextEntryFocused;
}
