import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Verifica che la richiesta provenga da un admin.
 * Ritorna null se autorizzato, altrimenti una NextResponse 403.
 */
export async function verificaAdmin(): Promise<NextResponse | null> {
  const h = await headers();
  const role = h.get("x-user-role");
  if (role !== "admin") {
    return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
  }
  return null;
}
