import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hashTokenWithRole } from "@/lib/auth";
import { getCurrentSitePassword } from "@/lib/password";
import type { UserRole } from "@/types/portafoglio";

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Richiesta non valida" },
      { status: 400 }
    );
  }

  const { password } = body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authSecret = process.env.AUTH_SECRET;

  if (!adminPassword || !authSecret) {
    return NextResponse.json(
      { error: "Configurazione server mancante" },
      { status: 500 }
    );
  }

  if (!password) {
    return NextResponse.json(
      { error: "Password errata" },
      { status: 401 }
    );
  }

  let sitePassword: string;
  try {
    sitePassword = await getCurrentSitePassword();
  } catch {
    return NextResponse.json(
      { error: "Configurazione server mancante" },
      { status: 500 }
    );
  }

  let role: UserRole;
  if (password === adminPassword) {
    role = "admin";
  } else if (password === sitePassword) {
    role = "user";
  } else {
    return NextResponse.json(
      { error: "Password errata" },
      { status: 401 }
    );
  }

  const token = hashTokenWithRole(password, authSecret, role);
  const cookieStore = await cookies();

  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 giorni
  });

  return NextResponse.json({ success: true, role });
}
