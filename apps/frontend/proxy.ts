import { privateEnvironment } from "@/environment/private-environment.schema";

import { NextResponse } from "next/server";

import type { NextRequest, ProxyConfig } from "next/server";

export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/graphql" ||
    request.nextUrl.pathname.startsWith("/api/auth")
  ) {
    const rewriteUrl = new URL(privateEnvironment.BACKEND_URL);

    rewriteUrl.pathname = request.nextUrl.pathname;

    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config: ProxyConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
