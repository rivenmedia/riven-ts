import { createContext, useContext } from "react";

import type { PropsWithChildren } from "react";

interface ScrollAreaContextValue {
  innerHeight: number;
  height: number;
  scrollTop: number;
}

const ScrollAreaContext = createContext<ScrollAreaContextValue | null>(null);

interface ScrollAreaProviderProps {
  context: ScrollAreaContextValue;
}

export function ScrollAreaProvider({
  children,
  context,
}: PropsWithChildren<ScrollAreaProviderProps>) {
  return (
    <ScrollAreaContext.Provider value={context}>
      {children}
    </ScrollAreaContext.Provider>
  );
}

export function useScrollAreaContext() {
  return useContext(ScrollAreaContext);
}
