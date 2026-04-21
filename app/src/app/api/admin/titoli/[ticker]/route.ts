import { NextResponse } from "next/server";
import { verificaAdmin } from "@/lib/admin";
import { getTitoloByTicker, updateTitolo, deleteTitolo } from "@/lib/db";
import type { Titolo, PortfolioId } from "@/types/portafoglio";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const portfolioId = (url.searchParams.get("portfolio") || "basic") as PortfolioId;

  const { ticker } = await params;
  const titolo = await getTitoloByTicker(ticker, portfolioId);
  if (!titolo) {
    return NextResponse.json({ error: "Titolo non trovato" }, { status: 404 });
  }
  return NextResponse.json(titolo);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const { ticker } = await params;

  let body: Partial<Titolo>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const portfolioId = ((body as Record<string, unknown>).portfolioId as PortfolioId) || "basic";

  const existing = await getTitoloByTicker(ticker, portfolioId);
  if (!existing) {
    return NextResponse.json({ error: "Titolo non trovato" }, { status: 404 });
  }

  // Ricalcola costo se numAzioni o prezzoMedioCarico cambiano
  const numAzioni = body.numAzioni ?? existing.numAzioni;
  const prezzoMedioCarico = body.prezzoMedioCarico ?? existing.prezzoMedioCarico;
  const costo = numAzioni * prezzoMedioCarico;

  await updateTitolo(ticker, { ...body, costo }, portfolioId);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const portfolioId = (url.searchParams.get("portfolio") || "basic") as PortfolioId;

  const { ticker } = await params;
  await deleteTitolo(ticker, portfolioId);
  return NextResponse.json({ success: true });
}
