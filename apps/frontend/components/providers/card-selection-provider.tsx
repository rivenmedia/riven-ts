"use client";

import {
  createContext,
  startTransition,
  useContext,
  useMemo,
  useState,
} from "react";

import { SelectionActionBar } from "../selection-action-bar/selection-action-bar";

import type { SelectionAction } from "../selection-action-bar/selection-action-bar";
import type { PropsWithChildren } from "react";

interface CardSelectionContextValue {
  selectedItems: Set<string>;
  toggleItemSelection: (id: string) => void;
  clearSelection: () => void;
}

const CardSelectionContext = createContext<
  CardSelectionContextValue | undefined
>(undefined);

interface CardSelectionProviderProps {
  actions: [SelectionAction, ...SelectionAction[]];
}

export function CardSelectionProvider({
  children,
  actions,
}: PropsWithChildren<CardSelectionProviderProps>) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  function toggleItemSelection(id: string) {
    startTransition(() => {
      setSelectedItems((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }

        return newSet;
      });
    });
  }

  function clearSelection() {
    setSelectedItems(new Set());
  }

  const value = useMemo<CardSelectionContextValue>(
    () => ({
      selectedItems,
      toggleItemSelection,
      clearSelection,
    }),
    [selectedItems],
  );

  return (
    <CardSelectionContext.Provider value={value}>
      {children}
      {selectedItems.size > 0 && (
        <SelectionActionBar
          count={selectedItems.size}
          actions={actions}
          // disabled={actionInProgress}
          onClear={() => {
            clearSelection();
          }}
        />
      )}
    </CardSelectionContext.Provider>
  );
}

export function useCardSelection() {
  return useContext(CardSelectionContext);
}
