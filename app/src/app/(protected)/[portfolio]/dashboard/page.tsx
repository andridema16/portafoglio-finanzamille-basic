export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getPortafoglio, getCategorie, getTitoli, getStorico, getDividendiTotaleAnno, getFlussiCapitaleDa } from "@/lib/db";
import { getPrezziMultipli, getStoricoSPY } from "@/lib/yahoo";
import {
  calcolaTitoloConPrezzoLive,
  ricalcolaCategoriaConTitoli,
  ricalcolaPortafoglioConTitoli,
  calcolaTWR,
} from "@/lib/calcoli";
import {
  formatValuta,

  formatPercentuale,
  colorePL,
  formatData,
} from "@/lib/format";
import type { Titolo, Categoria, PortfolioId } from "@/types/portafoglio";
import { isValidPortfolioId, getPortfolioMeta } from "@/lib/portfolio";
import DashboardCharts from "./DashboardCharts";
import InfoTooltip from "@/components/InfoTooltip";
import Link from "next/link";

function formatOra(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ portfolio: string }>;
}) {
  const { portfolio } = await params;

  if (!isValidPortfolioId(portfolio)) {
    notFound();
  }

  const portfolioId = portfolio as PortfolioId;
  const meta = getPortfolioMeta(portfolioId);
  const valuta = meta.valuta;

  const [portafoglioDB, categorieDB, titoliDB, storico, dividendiTotale2026] = await Promise.all([
    getPortafoglio(portfolioId),
    getCategorie(portfolioId),
    getTitoli(portfolioId),
    getStorico(portfolioId),
    getDividendiTotaleAnno(portfolioId, 2026),
  ]);

  // Flussi solo dal portafoglio corrente (dataInizio+), NON quelli precedenti
  const flussi = await getFlussiCapitaleDa(portfolioId, portafoglioDB.dataInizio);

  // Fetch prezzi live da Yahoo Finance
  const tickers = titoliDB.map((t) => t.ticker);
  let prezziLive: Record<string, number | null> = {};
  let prezziTimestamp: number | null = null;

  try {
    const risultato = await getPrezziMultipli(tickers);
    prezziLive = risultato.prezzi;
    prezziTimestamp = risultato.timestamp;
  } catch {
    // Se Yahoo fallisce, si usano i dati del DB
  }

  // Calcola la data più vecchia dello storico per fetchare SPY
  const dataInizioStorico = storico.length > 0 ? storico[0].data : portafoglioDB.dataInizio;

  // Fetch storico SPY per grafico comparativo
  let storicoSPY: { data: string; valore: number }[] = [];
  try {
    storicoSPY = await getStoricoSPY(dataInizioStorico);
  } catch {
    // Se fallisce, il grafico mostra solo la linea portafoglio
  }

  // Arricchisci titoli con prezzi live
  const titoliAggiornati = titoliDB.map((t) =>
    calcolaTitoloConPrezzoLive(t, prezziLive[t.ticker] ?? null)
  );

  // Totale portafoglio per calcolo peso % sul totale investito
  const totalPortafoglio = titoliAggiornati.reduce((s, t) => s + t.valoreAttuale, 0);

  // Raggruppa titoli per categoria e ricalcola
  const categorieMap = new Map<string, { categoria: Categoria; titoli: Titolo[] }>();
  for (const cat of categorieDB) {
    const titoliCat = titoliAggiornati.filter((t) => t.categoria === cat.id);
    categorieMap.set(cat.id, ricalcolaCategoriaConTitoli(cat, titoliCat, totalPortafoglio));
  }

  const categorie = categorieDB.map((c) => categorieMap.get(c.id)!.categoria);

  // Ricalcola portafoglio
  const portafoglio = ricalcolaPortafoglioConTitoli(portafoglioDB, categorie);

  // Calcola TWR (rendimento ponderato per il tempo)
  const twr = calcolaTWR(flussi, portafoglio.valoreAttuale);
  const twrPercentuale = twr * 100;

  // Valori per la sezione hero
  const guadagnoTotale = portafoglio.profittoOPerdita + portafoglio.utileRealizzato;


  return (
    <div className="space-y-4 md:space-y-6">
      {/* Sezione Hero */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        {/* Riga 1 — Intestazione */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-3 md:mb-6">
          <h2 className="text-xl font-bold text-nero">Riepilogo Portafoglio</h2>
          <div className="text-right text-xs text-gray-400 space-y-1">
            <p>Portafoglio aggiornato al {formatData(portafoglio.dataAggiornamento)}</p>
            {prezziTimestamp && (
              <p>Prezzi live alle {formatOra(prezziTimestamp)}</p>
            )}
          </div>
        </div>

        {/* Riga 2 — Metriche principali */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
          {/* Capitale Investito */}
          <div className="relative bg-gray-50 rounded-lg p-3 md:p-4">
            <div className="absolute top-2.5 right-2.5">
              <InfoTooltip testo="Somma del costo di acquisto di tutte le posizioni attualmente in portafoglio." />
            </div>
            <p className="text-sm text-gray-500">Capitale Investito</p>
            <p className="text-base md:text-xl font-bold text-nero mt-1">
              {formatValuta(portafoglio.investimentoIniziale, valuta)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Capitale corrente</p>
          </div>

          {/* Dividendi */}
          <div className="relative bg-gray-50 rounded-lg p-3 md:p-4">
            <div className="absolute top-2.5 right-2.5">
              <InfoTooltip testo="Totale dei dividendi ricevuti da tutti i titoli in portafoglio durante il 2026." />
            </div>
            <p className="text-sm text-gray-500">Dividendi</p>
            <p className="text-base md:text-xl font-bold text-verde-guadagno mt-1">
              {formatValuta(dividendiTotale2026, valuta)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Ricevuti nel 2026</p>
          </div>

          {/* Utile Realizzato */}
          <div className="relative bg-gray-50 rounded-lg p-3 md:p-4">
            <div className="absolute top-2.5 right-2.5">
              <InfoTooltip testo="Profitto incassato dalle vendite di titoli chiuse. Calcolato come: (prezzo vendita - prezzo acquisto) x numero azioni vendute, per ogni operazione." />
            </div>
            <p className="text-sm text-gray-500">Utile Realizzato</p>
            <p className={`text-base md:text-xl font-bold mt-1 ${colorePL(portafoglio.utileRealizzato)}`}>
              {formatValuta(portafoglio.utileRealizzato, valuta)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Da vendite</p>
          </div>

          {/* Guadagno Totale */}
          <div className="relative bg-gray-50 rounded-lg p-3 md:p-4">
            <div className="absolute top-2.5 right-2.5">
              <InfoTooltip testo={"Guadagno complessivo del portafoglio.\n\nFormula: P&L + utili realizzati da vendite.\n\nDove P&L = valore attuale delle posizioni - capitale investito + dividendi ricevuti."} />
            </div>
            <p className="text-sm text-gray-500">Guadagno Totale</p>
            <p className={`text-base md:text-xl font-bold mt-1 ${colorePL(guadagnoTotale)}`}>
              {formatValuta(guadagnoTotale, valuta)}
            </p>
            <p className="text-xs text-gray-400 mt-1 hidden md:block">P&L (incl. dividendi) + Utili realizzati</p>
            <p className="text-xs text-gray-400 mt-1 md:hidden">P&L + Utili</p>
          </div>
        </div>

        {/* Riga 3 — Barra totale */}
        <div className="border-t border-gray-200 pt-3 mt-3 md:pt-4 md:mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm md:text-lg font-semibold text-nero uppercase tracking-wide">
              Valore Totale
            </p>
            <InfoTooltip testo={"Valore di mercato attuale di tutte le posizioni in portafoglio (esclusa la liquidit\u00e0).\n\nLa variazione in dollari sotto la percentuale \u00e8 il P&L: valore attuale - capitale investito + dividendi.\n\nLa percentuale \u00e8 il rendimento TWR (Time-Weighted Return), che misura la performance al netto dei versamenti e prelievi."} />
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <p className="text-xl md:text-2xl font-bold text-nero">
              {formatValuta(portafoglio.valoreAttuale, valuta)}
            </p>
            <div>
              <p className={`text-sm md:text-lg font-bold ${colorePL(twrPercentuale)}`}>
                {formatPercentuale(twrPercentuale)}
              </p>
              <p className={`text-xs md:text-sm font-medium ${colorePL(portafoglio.profittoOPerdita)}`}>
                {formatValuta(portafoglio.profittoOPerdita, valuta)}
              </p>
            </div>
          </div>
        </div>

        {/* Sezione Liquidità — solo se presente */}
        {portafoglio.liquidita > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 mt-3 md:p-4 md:mt-4">
            <p className="text-xs md:text-sm text-nero">
              <span className="font-semibold">Liquidità: </span>
              {formatValuta(portafoglio.liquidita, valuta)} investiti short term a un rendimento del 4% da utilizzare per eventuali ingressi
            </p>
          </div>
        )}
      </div>

      {/* Sezione Grafico */}
      <DashboardCharts
        portfolioId={portfolioId}
        storicoPortafoglio={storico}
        storicoSPY={storicoSPY}
        categorie={categorie.map((c) => ({ nome: c.nome, valoreAttuale: c.valoreAttuale }))}
        valuta={valuta}
      />

      {/* Tabella Categorie */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-nero mb-3 md:mb-4">Categorie</h3>

        {/* Mobile — lista stile Trade Republic */}
        <div className="md:hidden divide-y divide-gray-100">
          {categorie.map((cat) => (
            <Link
              key={cat.id}
              href={`/${portfolioId}/categoria/${cat.slug}`}
              className="flex items-center justify-between py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-nero truncate">{cat.nome}</p>
                <p className="text-xs text-gray-400 mt-0.5">Peso: {cat.pesoPercentuale.toFixed(2)}%</p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="font-medium text-nero">{formatValuta(cat.valoreAttuale, valuta)}</p>
                <p className={`text-xs font-medium mt-0.5 ${colorePL(cat.profittoOPerdita)}`}>
                  {formatPercentuale(cat.plPercentuale)} ({formatValuta(cat.profittoOPerdita, valuta)})
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop — tabella classica */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">Categoria</th>
                <th className="pb-3 font-medium text-right">Peso %</th>
                <th className="pb-3 font-medium text-right">Valore</th>
                <th className="pb-3 font-medium text-right">P&L</th>
                <th className="pb-3 font-medium text-right">P&L %</th>
              </tr>
            </thead>
            <tbody>
              {categorie.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <Link
                      href={`/${portfolioId}/categoria/${cat.slug}`}
                      className="font-medium text-nero hover:text-verde-primario"
                    >
                      {cat.nome}
                    </Link>
                  </td>
                  <td className="py-3 text-right text-nero">{cat.pesoPercentuale.toFixed(2)}%</td>
                  <td className="py-3 text-right text-nero">{formatValuta(cat.valoreAttuale, valuta)}</td>
                  <td className={`py-3 text-right font-medium ${colorePL(cat.profittoOPerdita)}`}>
                    {formatValuta(cat.profittoOPerdita, valuta)}
                  </td>
                  <td className={`py-3 text-right font-medium ${colorePL(cat.plPercentuale)}`}>
                    {formatPercentuale(cat.plPercentuale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
