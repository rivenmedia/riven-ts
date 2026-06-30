"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ArrowLeft, Home, RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";

import type { ErrorInfo } from "next/error";

export default function ErrorPage({ unstable_retry, error }: ErrorInfo) {
  const isBrowser = typeof window !== "undefined";
  const message = error.message || "Something went wrong";
  const statusCode = parseInt(
    /status code (\d+)/i.exec(message)?.[1] ?? "500",
    10,
  );

  function getMetadata() {
    switch (statusCode) {
      case 400:
        return {
          title: "Bad request",
          detail: "The URL contains a value Riven cannot use.",
        };
      case 401:
      case 403:
        return {
          title: "Access denied",
          detail: "Your account does not have permission to view this page.",
        };
      case 404:
        return {
          title: "Page not found",
          detail: "The page or metadata record could not be found.",
        };
    }

    if (statusCode >= 500) {
      return {
        title: "The backend hit turbulence",
        detail:
          "Riven could not finish this request. Try again, or check the backend logs if it keeps happening.",
      };
    }

    return {
      title: "Unable to load page",
      detail: "Riven could not finish this request.",
    };
  }

  const { title, detail } = getMetadata();

  return (
    <div className="relative isolate flex min-h-[calc(100vh-4rem)] items-center overflow-hidden px-4 py-16 md:px-10">
      <div className="absolute inset-0 -z-10">
        <div className="bg-background absolute inset-0"></div>
        <div className="via-primary/50 absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent"></div>
        <div className="bg-primary/10 absolute top-1/4 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-[110px]"></div>
        <div className="bg-accent/10 absolute right-0 bottom-0 h-72 w-72 rounded-full blur-[120px]"></div>
      </div>

      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-5">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary w-fit px-3 py-1 font-mono text-xs"
          >
            <TriangleAlert className="size-3" />
            Error
          </Badge>

          <div className="font-heading text-foreground/90 text-[8rem] leading-none font-bold sm:text-[10rem]">
            {statusCode}
          </div>

          <div>
            <h1 className="font-heading text-foreground text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <div className="bg-primary mt-3 h-1 w-16 rounded-full"></div>
          </div>

          <div className="max-w-2xl space-y-3">
            <p className="text-muted-foreground text-base leading-7 md:text-lg">
              {detail}
            </p>
            {message && message !== detail && (
              <p className="border-border/50 bg-muted/20 text-muted-foreground rounded-lg border px-4 py-3 font-mono text-xs leading-5">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              window.history.back();
            }}
            disabled={!isBrowser}
          >
            <ArrowLeft />
            Back
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home />
              Home
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={unstable_retry}
            disabled={!isBrowser}
          >
            <RotateCcw />
            Retry
          </Button>
        </div>
      </section>
    </div>
  );
}
