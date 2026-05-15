import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  const needsStaff = pathname.startsWith("/staff");
  const needsAdmin = pathname.startsWith("/admin");

  if (!needsStaff && !needsAdmin) return NextResponse.next();

  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (needsAdmin && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/staff", req.url));
  }

  if (needsStaff && role !== "STAFF" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/staff/:path*", "/admin/:path*"],
};
