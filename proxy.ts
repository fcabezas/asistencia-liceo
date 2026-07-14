import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const roleHome: Record<string, string> = {
  admin: "/admin",
  director: "/director/reports",
  inspector_general: "/inspector/dashboard",
  inspector_pasillo: "/inspector/dashboard",
  teacher: "/dashboard",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic = pathname === "/login" || pathname.startsWith("/api/auth");
  if (isPublic) {
    return NextResponse.next();
  }

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  const role = session.user.role;

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(roleHome[role] ?? "/login", req.nextUrl));
  }
  if (
    pathname.startsWith("/inspector") &&
    role !== "inspector_general" &&
    role !== "inspector_pasillo"
  ) {
    return NextResponse.redirect(new URL(roleHome[role] ?? "/login", req.nextUrl));
  }
  if (pathname.startsWith("/director") && role !== "director" && role !== "admin") {
    return NextResponse.redirect(new URL(roleHome[role] ?? "/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/whatsapp|api/cron|.*\\..*).*)",
  ],
};
