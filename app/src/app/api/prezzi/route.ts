import { NextResponse } from "next/server";
import { getTitoli } from "@/lib/db";
import { getPrezziMultipli } from "@/lib/yahoo";
import type { PortfolioId } from "@/types/portafoglio";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const portfolioId = (url.searchParams.get("portfolio") || "basic") as PortfolioId;

    const titoli = await getTitoli(portfolioId);
    const tickers = titoli.map((t) => t.ticker);
    const { prezzi, timestamp } = await getPrezziMultipli(tickers);

    return NextResponse.json({ prezzi, timestamp });
  } catch {
    return NextResponse.json(
      { error: "Errore nel recupero dei prezzi" },
      { status: 500 }
    );
  }
}
