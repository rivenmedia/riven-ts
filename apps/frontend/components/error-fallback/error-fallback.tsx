"use client";

import { cn } from "cn";
import { catchError } from "next/error";

import { Button } from "../_ui/button";

import type { ErrorInfo } from "next/error";
import type { HTMLAttributes } from "react";

export interface ErrorFallbackProps extends Pick<
  HTMLAttributes<HTMLDivElement>,
  "className"
> {
  message: string;
}

export const ErrorFallback = catchError(
  ({ className, message }: ErrorFallbackProps, { retry }: ErrorInfo) => (
    <div
      className={cn(
        "bg-muted flex w-full flex-col items-center justify-center gap-4 rounded-2xl p-8",
        className,
      )}
    >
      <p>{message}</p>
      <Button onClick={retry} type="button">
        Retry
      </Button>
    </div>
  ),
);
