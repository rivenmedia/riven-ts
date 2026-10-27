"use client";

import { createContext, use } from "react";

import type { PropsWithChildren } from "react";

const LiveContentContext = createContext<boolean>(false);

/**
 * Hook to access the live content context.
 * Returns `true` if the content is live (e.g. may be updated by a subscription), `false` otherwise.
 */
export function useLiveContent() {
  return use(LiveContentContext);
}

/** Provider component that wraps a section of content that may be updated by a subscription */
export function LiveContentProvider({ children }: PropsWithChildren) {
  return (
    <LiveContentContext.Provider value>{children}</LiveContentContext.Provider>
  );
}
