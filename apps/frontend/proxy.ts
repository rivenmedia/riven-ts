import { privateEnvironment } from "@/environment/private-environment.schema";
import { authClient } from "@/lib/auth/client";

import { NextResponse } from "next/server";

import type { AppRoutes } from "./.next/dev/types/routes";
import type { NextRequest, ProxyConfig } from "next/server";

const paths = {
  login: "/login",
  home: "/",
} as const satisfies Record<string, AppRoutes>;

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/graphql" ||
    request.nextUrl.pathname.startsWith("/api/auth")
  ) {
    const rewriteUrl = new URL(
      request.nextUrl.pathname,
      privateEnvironment.BACKEND_URL,
    );

    return NextResponse.rewrite(rewriteUrl);
  }

  const { data: session } = await authClient.getSession();

  if (!session && request.nextUrl.pathname !== paths.login) {
    return NextResponse.redirect(new URL(paths.login, request.url));
  } else if (session && request.nextUrl.pathname === paths.login) {
    return NextResponse.redirect(new URL(paths.home, request.url));
  }

  return NextResponse.next();
}

export const config: ProxyConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
