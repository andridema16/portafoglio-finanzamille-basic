import { NextResponse } from "next/server";
import { verificaAdmin } from "@/lib/admin";
import { getFlussiCapitale, deleteFlussoCapitale } from "@/lib/db";
import type { PortfolioId } from "@/types/portafoglio";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const portfolioId = (url.searchParams.get("portfolio") || "basic") as PortfolioId;

  const { id } = await params;
  const numId = Number(id);

  // Non permettere di eliminare il flusso con tipo='inizio'
  const flussi = await getFlussiCapitale(portfolioId);
  const flusso = flussi.find((f) => f.id === numId);

  if (!flusso) {
    return NextResponse.json({ error: "Flusso non trovato" }, { status: 404 });
  }

  if (flusso.tipo === "inizio") {
    return NextResponse.json({ error: "Non è possibile eliminare il flusso iniziale" }, { status: 400 });
  }

  await deleteFlussoCapitale(numId);
  return NextResponse.json({ success: true });
}
