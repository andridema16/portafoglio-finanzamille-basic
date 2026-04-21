import { NextResponse } from "next/server";
import { verificaAdmin } from "@/lib/admin";
import { getCategorie, createCategoria } from "@/lib/db";
import type { Categoria, PortfolioId } from "@/types/portafoglio";

export async function GET(request: Request) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const portfolioId = (url.searchParams.get("portfolio") || "basic") as PortfolioId;

  const categorie = await getCategorie(portfolioId);
  return NextResponse.json(categorie);
}

export async function POST(request: Request) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  let body: Partial<Categoria>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const portfolioId = ((body as Record<string, unknown>).portfolioId as PortfolioId) || "basic";
  const { id, nome, slug } = body;
  if (!id || !nome || !slug) {
    return NextResponse.json({ error: "Campi obbligatori: id, nome, slug" }, { status: 400 });
  }

  const categoria: Categoria = {
    portfolioId,
    id,
    nome,
    slug,
    pesoPercentuale: body.pesoPercentuale ?? 0,
    costo: body.costo ?? 0,
    valoreAttuale: body.valoreAttuale ?? 0,
    profittoOPerdita: body.profittoOPerdita ?? 0,
    plPercentuale: body.plPercentuale ?? 0,
    dividendi: body.dividendi ?? 0,
  };

  await createCategoria(categoria);
  return NextResponse.json(categoria, { status: 201 });
}
