"use client";

import { ArrowLeft, Home, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
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
            404
          </div>

          <div>
            <h1 className="font-heading text-foreground text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Page not found
            </h1>
            <div className="bg-primary mt-3 h-1 w-16 rounded-full"></div>
          </div>

          <div className="max-w-2xl space-y-3">
            <p className="text-muted-foreground text-base leading-7 md:text-lg">
              The page or resource you are looking for could not be found.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              window.history.back();
            }}
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
        </div>
      </section>
    </div>
  );
}
