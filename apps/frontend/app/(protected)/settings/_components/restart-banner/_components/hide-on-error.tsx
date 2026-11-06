"use client";

import { catchError } from "next/error";

/**
 * Renders nothing if its children throw,
 * for optional content that mustn't take the page down.
 */
export const HideOnError = catchError(() => null);
