import { NextResponse } from "next/server";
import { verificaAdmin } from "@/lib/admin";
import {
  getDividendiConId,
  getOperazioniConId,
  createDividendo,
  createOperazione,
  getTitoloByTicker,
  updateTitolo,
  deleteTitolo,
  createTitolo,
  getPortafoglio,
  updatePortafoglio,
} from "@/lib/db";
import {
  calcolaVendita,
  calcolaAcquisto,
  calcolaDividendo,
} from "@/lib/calcoli";
import { ricalcolaCascata } from "@/lib/ricalcola-portafoglio";
import type { AssetClass, Paese, Settore, PortfolioId } from "@/types/portafoglio";

export async function GET(request: Request) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const portfolioId = (url.searchParams.get("portfolio") || "basic") as PortfolioId;

  const [dividendi, operazioni] = await Promise.all([
    getDividendiConId(portfolioId),
    getOperazioniConId(portfolioId),
  ]);

  return NextResponse.json({ dividendi, operazioni });
}

export async function POST(request: Request) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Richiesta non valida" },
      { status: 400 }
    );
  }

  const portfolioId = ((body.portfolioId as string) || "basic") as PortfolioId;
  const tipo = body.tipo as string;
  const data =
    (body.data as string) || new Date().toISOString().slice(0, 10);

  // ─── VENDITA ───────────────────────────────────────────────
  if (tipo === "vendita") {
    const ticker = (body.ticker as string)?.toUpperCase();
    const azioniVendute = Number(body.azioniVendute);
    const prezzoVendita = Number(body.prezzoVendita);
    const nota = (body.nota as string) ?? "";

    if (!ticker || isNaN(azioniVendute) || azioniVendute <= 0 || isNaN(prezzoVendita) || prezzoVendita <= 0) {
      return NextResponse.json(
        { error: "Campi obbligatori: ticker, azioniVendute (> 0), prezzoVendita (> 0)" },
        { status: 400 }
      );
    }

    const titolo = await getTitoloByTicker(ticker, portfolioId);
    if (!titolo) {
      return NextResponse.json(
        { error: `Ticker "${ticker}" non presente in portafoglio` },
        { status: 404 }
      );
    }

    if (azioniVendute > titolo.numAzioni) {
      return NextResponse.json(
        {
          error: `Azioni insufficienti: hai ${titolo.numAzioni}, vendita richiesta ${azioniVendute}`,
        },
        { status: 400 }
      );
    }

    const risultato = calcolaVendita(
      titolo,
      azioniVendute,
      prezzoVendita,
      data,
      nota
    );

    // Salva operazione
    await createOperazione(risultato.operazione, portfolioId);

    // Aggiorna o elimina il titolo
    if (risultato.titoloEliminato) {
      await deleteTitolo(ticker, portfolioId);
    } else {
      await updateTitolo(ticker, risultato.titoloAggiornato, portfolioId);
    }

    // Aggiorna liquidita e utile realizzato nel portafoglio
    const portafoglio = await getPortafoglio(portfolioId);
    portafoglio.liquidita += risultato.deltaLiquidita;
    portafoglio.utileRealizzato += risultato.utileRealizzato;
    await updatePortafoglio(portafoglio);

    // Ricalcola a cascata (categorie + portafoglio)
    await ricalcolaCascata(
      portfolioId,
      risultato.titoloEliminato ? undefined : risultato.titoloAggiornato
    );

    return NextResponse.json(
      {
        operazione: risultato.operazione,
        titoloAggiornato: risultato.titoloEliminato
          ? null
          : risultato.titoloAggiornato,
        deltaLiquidita: risultato.deltaLiquidita,
        utileRealizzato: risultato.utileRealizzato,
        titoloEliminato: risultato.titoloEliminato,
      },
      { status: 201 }
    );
  }

  // ─── ACQUISTO ──────────────────────────────────────────────
  if (tipo === "acquisto") {
    const ticker = (body.ticker as string)?.toUpperCase();
    const azioniComprate = Number(body.azioniComprate);
    const prezzoAcquisto = Number(body.prezzoAcquisto);
    const nota = (body.nota as string) ?? "";

    if (!ticker || isNaN(azioniComprate) || azioniComprate <= 0 || isNaN(prezzoAcquisto) || prezzoAcquisto <= 0) {
      return NextResponse.json(
        { error: "Campi obbligatori: ticker, azioniComprate (> 0), prezzoAcquisto (> 0)" },
        { status: 400 }
      );
    }

    let titolo = await getTitoloByTicker(ticker, portfolioId);
    let isNuovoTitolo = false;

    // Titolo non esiste: richiede campi extra per creazione
    if (!titolo) {
      const nome = body.nome as string;
      const categoria = body.categoria as string;
      const assetClass = body.assetClass as AssetClass;
      const paese = body.paese as Paese;
      const settore = body.settore as Settore;

      if (!nome || !categoria || !assetClass || !paese || !settore) {
        return NextResponse.json(
          {
            error: "Ticker non esistente. Per un nuovo titolo servono: nome, categoria, assetClass, paese, settore",
            campiMancanti: ["nome", "categoria", "assetClass", "paese", "settore"],
            nuovoTitolo: true,
          },
          { status: 400 }
        );
      }

      // Crea titolo "vuoto" come base per il calcolo
      titolo = {
        portfolioId,
        ticker,
        nome,
        categoria,
        numAzioni: 0,
        prezzoMedioCarico: 0,
        costo: 0,
        valoreAttuale: 0,
        pesoPercentuale: 0,
        varPrezzo: 0,
        dividendi: 0,
        profittoOPerdita: 0,
        plPercentuale: 0,
        peRatio: null,
        isin: (body.isin as string) ?? null,
        assetClass,
        paese,
        settore,
      };
      isNuovoTitolo = true;
    }

    const risultato = calcolaAcquisto(
      titolo,
      azioniComprate,
      prezzoAcquisto,
      data,
      nota
    );

    // Salva operazione
    await createOperazione(risultato.operazione, portfolioId);

    // Crea o aggiorna il titolo
    if (isNuovoTitolo) {
      await createTitolo(risultato.titoloAggiornato);
    } else {
      await updateTitolo(ticker, risultato.titoloAggiornato, portfolioId);
    }

    // Aggiorna liquidita nel portafoglio
    const portafoglio = await getPortafoglio(portfolioId);
    portafoglio.liquidita += risultato.deltaLiquidita;
    await updatePortafoglio(portafoglio);

    // Ricalcola a cascata
    await ricalcolaCascata(portfolioId, risultato.titoloAggiornato);

    return NextResponse.json(
      {
        operazione: risultato.operazione,
        titoloAggiornato: risultato.titoloAggiornato,
        deltaLiquidita: risultato.deltaLiquidita,
        nuovoTitolo: isNuovoTitolo,
      },
      { status: 201 }
    );
  }

  // ─── DIVIDENDO ─────────────────────────────────────────────
  if (tipo === "dividendo") {
    const ticker = (body.ticker as string)?.toUpperCase();
    const importo = Number(body.importo);
    const descrizione = body.descrizione as string | undefined;

    if (!ticker || isNaN(importo) || importo <= 0) {
      return NextResponse.json(
        { error: "Campi obbligatori: ticker, importo (> 0)" },
        { status: 400 }
      );
    }

    const titolo = await getTitoloByTicker(ticker, portfolioId);
    if (!titolo) {
      return NextResponse.json(
        { error: `Ticker "${ticker}" non presente in portafoglio` },
        { status: 404 }
      );
    }

    const risultato = calcolaDividendo(titolo, importo, data, descrizione);

    // Salva dividendo
    await createDividendo(risultato.dividendo, portfolioId);

    // Aggiorna titolo (dividendi incrementati)
    await updateTitolo(ticker, risultato.titoloAggiornato, portfolioId);

    // Aggiorna liquidita nel portafoglio
    const portafoglio = await getPortafoglio(portfolioId);
    portafoglio.liquidita += risultato.deltaLiquidita;
    await updatePortafoglio(portafoglio);

    // Ricalcola a cascata
    await ricalcolaCascata(portfolioId, risultato.titoloAggiornato);

    return NextResponse.json(
      {
        dividendo: risultato.dividendo,
        titoloAggiornato: risultato.titoloAggiornato,
        deltaLiquidita: risultato.deltaLiquidita,
      },
      { status: 201 }
    );
  }

  return NextResponse.json(
    { error: "Tipo non valido (dividendo, vendita, acquisto)" },
    { status: 400 }
  );
}
