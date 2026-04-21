export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getPortafoglio, getCategorie, getTitoli } from "@/lib/db";
import { getPrezziMultipli } from "@/lib/yahoo";
import {
  calcolaTitoloConPrezzoLive,
  ricalcolaCategoriaConTitoli,
  ricalcolaPortafoglioConTitoli,
} from "@/lib/calcoli";
import {
  formatValuta,
  formatValutaDecimali,
  formatPercentuale,
  formatNumero,
  colorePL,
  formatData,
} from "@/lib/format";
import type { Titolo, Categoria, PortfolioId } from "@/types/portafoglio";
import { isValidPortfolioId, getPortfolioMeta } from "@/lib/portfolio";
import { Fragment } from "react";
import Link from "next/link";
import TickerLogo from "@/components/TickerLogo";

function formatOra(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });
}

export default async function ComposizionePage({
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

  const [portafoglioDB, categorieDB, titoliDB] = await Promise.all([
    getPortafoglio(portfolioId),
    getCategorie(portfolioId),
    getTitoli(portfolioId),
  ]);

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
  const titoliTyped = categorieDB.flatMap((c) => categorieMap.get(c.id)!.titoli);

  // Ricalcola portafoglio
  const portafoglio = ricalcolaPortafoglioConTitoli(portafoglioDB, categorie);

  // Peso % di ogni titolo rispetto al valore totale investito (senza liquidita)
  const totaleTitoli = titoliTyped.reduce((s, t) => s + t.valoreAttuale, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl font-bold text-nero">Composizione Portafoglio</h2>
        <div className="text-right text-xs text-gray-400 space-y-1">
          <p>Portafoglio aggiornato al {formatData(portafoglio.dataAggiornamento)}</p>
          {prezziTimestamp && (
            <p>Prezzi live alle {formatOra(prezziTimestamp)}</p>
          )}
        </div>
      </div>

      {/* Tabella Composizione */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        {/* Mobile — lista stile Trade Republic */}
        <div className="md:hidden">
          {/* Totale */}
          <div className="flex items-center justify-between px-4 py-3 bg-verde-scuro/10 border-b-2 border-verde-scuro/20">
            <div>
              <p className="text-base font-bold text-nero">Totale</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Div: {formatValutaDecimali(titoliTyped.reduce((s, t) => s + t.dividendi, 0), valuta)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-nero">{formatValuta(totaleTitoli, valuta)}</p>
              <p className={`text-xs font-bold ${colorePL(portafoglio.varPercentuale)}`}>
                {formatPercentuale(portafoglio.varPercentuale)} ({formatValuta(portafoglio.profittoOPerdita, valuta)})
              </p>
            </div>
          </div>

          {categorieDB.map((catDB) => {
            const entry = categorieMap.get(catDB.id)!;
            const cat = entry.categoria;
            const titoliCat = entry.titoli;
            return (
              <Fragment key={cat.id}>
                {/* Header categoria */}
                <div className="bg-verde-scuro px-4 py-2.5">
                  <Link
                    href={`/${portfolioId}/categoria/${cat.slug}`}
                    className="flex items-center justify-between text-white"
                  >
                    <span className="font-semibold text-sm">{cat.nome}</span>
                    <div className="text-right text-xs font-medium">
                      <span>{cat.pesoPercentuale.toFixed(2)}% &middot; {formatValuta(cat.valoreAttuale, valuta)}</span>
                    </div>
                  </Link>
                </div>

                {/* Titoli */}
                <div className="divide-y divide-gray-100">
                  {titoliCat.map((t) => (
                    <div key={t.ticker} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <TickerLogo ticker={t.ticker} nome={t.nome} size={32} />
                        <div className="min-w-0">
                          <p className="font-mono font-semibold text-verde-scuro text-sm">{t.ticker}</p>
                          <p className="text-xs text-gray-400 truncate">{t.nome}</p>
                        </div>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="font-medium text-nero text-sm">{formatValuta(t.valoreAttuale, valuta)}</p>
                        <p className={`text-xs font-medium ${colorePL(t.plPercentuale)}`}>
                          {formatPercentuale(t.plPercentuale)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Fragment>
            );
          })}
        </div>

        {/* Desktop — tabella classica */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">Titolo</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">N. Azioni</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Prezzo Carico</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Valore Attuale</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Peso %</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Dividendi</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">P&L</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">P&L %</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-verde-scuro/10 border-b-2 border-verde-scuro/20">
                <td className="px-6 py-4 text-base font-bold text-nero" colSpan={3}>
                  Totale
                </td>
                <td className="px-6 py-4 text-right text-base font-bold text-nero">{formatValuta(totaleTitoli, valuta)}</td>
                <td className="px-6 py-4 text-right" />
                <td className="px-6 py-4 text-right text-base font-bold text-nero">
                  {formatValutaDecimali(titoliTyped.reduce((s, t) => s + t.dividendi, 0), valuta)}
                </td>
                <td className={`px-6 py-4 text-right text-base font-bold ${colorePL(portafoglio.profittoOPerdita)}`}>
                  {formatValuta(portafoglio.profittoOPerdita, valuta)}
                </td>
                <td className={`px-6 py-4 text-right text-base font-bold ${colorePL(portafoglio.varPercentuale)}`}>
                  {formatPercentuale(portafoglio.varPercentuale)}
                </td>
              </tr>
              {categorieDB.map((catDB) => {
                const entry = categorieMap.get(catDB.id)!;
                const cat = entry.categoria;
                const titoliCat = entry.titoli;
                return (
                  <Fragment key={cat.id}>
                    <tr className="bg-verde-scuro">
                      <td colSpan={8} className="px-6 py-2.5">
                        <div className="flex items-center justify-between text-white font-semibold text-sm">
                          <Link
                            href={`/${portfolioId}/categoria/${cat.slug}`}
                            className="hover:underline"
                          >
                            {cat.nome}
                          </Link>
                          <div className="flex items-center gap-6 text-xs font-medium">
                            <span>Peso: {cat.pesoPercentuale.toFixed(2)}%</span>
                            <span>{formatValuta(cat.valoreAttuale, valuta)}</span>
                            <span>
                              P&L: {formatValuta(cat.profittoOPerdita, valuta)} ({formatPercentuale(cat.plPercentuale)})
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {titoliCat.map((t) => (
                      <tr
                        key={t.ticker}
                        className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <TickerLogo ticker={t.ticker} nome={t.nome} size={28} />
                            <div className="min-w-0">
                              <p className="font-semibold text-nero">{t.ticker}</p>
                              <p className="text-xs text-gray-400 truncate">{t.nome}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right">{formatNumero(t.numAzioni)}</td>
                        <td className="px-6 py-3 text-right">{formatValuta(t.prezzoMedioCarico, valuta)}</td>
                        <td className="px-6 py-3 text-right">{formatValuta(t.valoreAttuale, valuta)}</td>
                        <td className="px-6 py-3 text-right">{t.pesoPercentuale.toFixed(2)}%</td>
                        <td className="px-6 py-3 text-right">
                          {t.dividendi > 0 ? formatValutaDecimali(t.dividendi, valuta) : "-"}
                        </td>
                        <td className={`px-6 py-3 text-right font-medium ${colorePL(t.profittoOPerdita)}`}>
                          {formatValuta(t.profittoOPerdita, valuta)}
                        </td>
                        <td className={`px-6 py-3 text-right font-medium ${colorePL(t.plPercentuale)}`}>
                          {formatPercentuale(t.plPercentuale)}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
