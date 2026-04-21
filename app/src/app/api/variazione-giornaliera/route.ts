import { NextResponse } from "next/server";
import { getTitoli } from "@/lib/db";
import { getPrezziConPreviousClose } from "@/lib/yahoo";
import type { PortfolioId } from "@/types/portafoglio";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const portfolioId = (url.searchParams.get("portfolio") || "basic") as PortfolioId;

    const titoli = await getTitoli(portfolioId);
    const tickers = titoli.map((t) => t.ticker);
    const { prezzi, timestamp } = await getPrezziConPreviousClose(tickers);

    let valoreCorrente = 0;
    let valorePreviousClose = 0;
    let tickerValidi = 0;

    for (const titolo of titoli) {
      const dati = prezzi[titolo.ticker];
      if (!dati) continue;

      const { prezzo, previousClose } = dati;
      if (prezzo != null && previousClose != null) {
        valoreCorrente += titolo.numAzioni * prezzo;
        valorePreviousClose += titolo.numAzioni * previousClose;
        tickerValidi++;
      }
    }

    if (tickerValidi === 0) {
      return NextResponse.json(
        { error: "Nessun prezzo disponibile" },
        { status: 503 }
      );
    }

    const variazioneDollari = valoreCorrente - valorePreviousClose;
    const variazionePercentuale =
      valorePreviousClose > 0
        ? (variazioneDollari / valorePreviousClose) * 100
        : 0;

    return NextResponse.json({
      variazioneDollari,
      variazionePercentuale,
      valoreCorrente,
      tickerValidi,
      timestamp,
    });
  } catch (err) {
    console.error("variazione-giornaliera error:", err);
    return NextResponse.json(
      { error: "Errore nel calcolo della variazione giornaliera" },
      { status: 500 }
    );
  }
}
