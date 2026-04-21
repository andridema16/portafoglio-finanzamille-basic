import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenAndGetRole } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Non proteggere la pagina di login e l'API auth
  if (pathname === "/" || pathname === "/api/auth") {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const role = await verifyTokenAndGetRole(token);

  if (!role) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect /dashboard verso /scegli-portafoglio (non esiste piu come rotta diretta)
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/scegli-portafoglio", request.url));
  }

  // Blocca /admin/* e /api/admin/* per utenti non-admin
  if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/scegli-portafoglio", request.url));
  }

  // Inietta header x-user-role come request header per i componenti server
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-role", role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
