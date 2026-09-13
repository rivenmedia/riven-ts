import { useInput } from "ink";
import { createContext, useContext, useMemo, useState } from "react";

import type { PropsWithChildren } from "react";

export interface ActionsMenuContextValue {
  isVisible: boolean;
  closeMenu: () => void;
  openMenu: () => void;
}

const ActionsMenuContext = createContext<ActionsMenuContextValue | undefined>(
  undefined,
);

export function ActionsMenuProvider({ children }: PropsWithChildren) {
  const [isVisible, setIsVisible] = useState(false);
  const contextValue = useMemo<ActionsMenuContextValue>(
    () => ({
      isVisible,
      closeMenu: () => {
        setIsVisible(false);
      },
      openMenu: () => {
        setIsVisible(true);
      },
    }),
    [isVisible],
  );

  useInput((input) => {
    if (input.toLowerCase() === "a") {
      setIsVisible((prev) => !prev);
    }
  });

  return (
    <ActionsMenuContext.Provider value={contextValue}>
      {children}
    </ActionsMenuContext.Provider>
  );
}

export function useActionsMenuContext() {
  const context = useContext(ActionsMenuContext);

  if (!context) {
    throw new Error(
      "useActionsMenuContext must be used within an ActionsMenuProvider",
    );
  }

  return context;
}
