import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token?.role === "admin") {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();

  redirectUrl.search = "";

  if (token) {
    redirectUrl.pathname = "/conta";
  } else {
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
