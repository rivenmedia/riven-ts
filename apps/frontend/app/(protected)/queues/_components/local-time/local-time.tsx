"use client";

import { Suspense, use } from "react";
import { browser } from "react-dom";

import { formatClockTime, formatDateTime } from "../../_utilities/format.ts";

import type { ReactNode } from "react";

export interface LocalTimeProps {
  /** ISO 8601. */
  iso: string;
  locale: string;
  /** "date-time" is "26 Nov, 13:49:51"; "clock" is "13:52". */
  format: "date-time" | "clock";
  /** Shown on the server and until the browser takes over. */
  fallback: ReactNode;
  className?: string | undefined;
}

function BrowserTime({
  iso,
  locale,
  format,
  className,
}: Omit<LocalTimeProps, "fallback">) {
  use(browser());

  return (
    <time dateTime={iso} className={className}>
      {format === "clock"
        ? formatClockTime(iso, locale)
        : formatDateTime(iso, locale)}
    </time>
  );
}

/**
 * An absolute time in the viewer's own time zone. The server doesn't know
 * that zone, so it renders the fallback and the browser the real time.
 */
export function LocalTime({ fallback, ...props }: LocalTimeProps) {
  return (
    <Suspense
      fallback={
        <time dateTime={props.iso} className={props.className}>
          {fallback}
        </time>
      }
    >
      <BrowserTime {...props} />
    </Suspense>
  );
}
