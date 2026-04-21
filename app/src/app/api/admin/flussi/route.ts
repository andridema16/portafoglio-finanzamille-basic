import { NextResponse } from "next/server";
import { verificaAdmin } from "@/lib/admin";
import { getFlussiCapitale, addFlussoCapitale, updateInvestimentoIniziale } from "@/lib/db";
import type { PortfolioId } from "@/types/portafoglio";

export async function GET(request: Request) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const portfolioId = (url.searchParams.get("portfolio") || "basic") as PortfolioId;

  const flussi = await getFlussiCapitale(portfolioId);
  return NextResponse.json(flussi);
}

export async function POST(request: Request) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const portfolioId = ((body.portfolioId as string) || "basic") as PortfolioId;
  const { data, tipo, importo, valorePre, capitalePost, nota } = body as Record<string, unknown>;

  if (!data || !tipo || importo == null || valorePre == null || capitalePost == null) {
    return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
  }

  const tipoStr = tipo as string;
  if (tipoStr !== "deposito" && tipoStr !== "prelievo") {
    return NextResponse.json({ error: "Tipo non valido (deposito o prelievo)" }, { status: 400 });
  }

  const flusso = {
    data: data as string,
    tipo: tipoStr as "deposito" | "prelievo",
    importo: Number(importo),
    valorePre: Number(valorePre),
    capitalePost: Number(capitalePost),
    nota: (nota as string) ?? "",
  };

  await addFlussoCapitale(flusso, portfolioId);

  // Aggiorna investimento_iniziale se questo flusso è il più recente (o pari data)
  const flussiEsistenti = await getFlussiCapitale(portfolioId);
  const ultimoFlusso = flussiEsistenti[flussiEsistenti.length - 1];
  if (ultimoFlusso && flusso.data >= ultimoFlusso.data) {
    await updateInvestimentoIniziale(flusso.capitalePost, portfolioId);
  }

  return NextResponse.json(flusso, { status: 201 });
}
