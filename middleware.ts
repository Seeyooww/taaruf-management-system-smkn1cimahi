import { NextResponse, type NextRequest } from "next/server";

import { getMiddlewareSession } from "@/middleware/session";
import { resolveRouteRedirect } from "@/utils/auth-routes";

export async function middleware(request: NextRequest) {
  const { response, session } = await getMiddlewareSession(request);
  const redirectTo = resolveRouteRedirect(request.nextUrl.pathname, session);

  if (!redirectTo) {
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = redirectTo;
  url.searchParams.set("from", request.nextUrl.pathname);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
