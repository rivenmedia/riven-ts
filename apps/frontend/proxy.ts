import { GET_INSTANCE_SETUP_REQUIRED } from "@/app/_queries/get-instance-setup-required.query";
import { privateEnvironment } from "@/environment/private-environment.schema";
import { authClient } from "@/lib/auth/client";
import { getClient } from "@/lib/graphql/client";

import { NextResponse } from "next/server";

import type { AppRoutes } from "./.next/dev/types/routes";
import type { NextRequest, ProxyConfig } from "next/server";

const paths = {
  login: "/login",
  home: "/",
  instanceSetup: "/setup",
} as const satisfies Record<string, AppRoutes>;

const client = getClient();

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
  } else if (
    request.nextUrl.pathname !== paths.instanceSetup &&
    session?.user.role === "admin"
  ) {
    const { data } = await client.query({ query: GET_INSTANCE_SETUP_REQUIRED });

    if (data?.instanceStatus.setupRequired) {
      return NextResponse.redirect(new URL(paths.instanceSetup, request.url));
    }
  }

  return NextResponse.next();
}

export const config: ProxyConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
