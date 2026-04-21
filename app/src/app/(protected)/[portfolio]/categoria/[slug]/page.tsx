export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCategoriaBySlug, getTitoliByCategoria, getTitoli } from "@/lib/db";
import { getPrezziMultipli } from "@/lib/yahoo";
import { calcolaTitoloConPrezzoLive, ricalcolaCategoriaConTitoli } from "@/lib/calcoli";
import { formatValuta, formatValutaDecimali, formatPercentuale, formatNumero, colorePL } from "@/lib/format";
import type { PortfolioId } from "@/types/portafoglio";
import { isValidPortfolioId, getPortfolioMeta } from "@/lib/portfolio";
import TickerLogo from "@/components/TickerLogo";

function formatOra(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ portfolio: string; slug: string }>;
}) {
  const { portfolio, slug } = await params;

  if (!isValidPortfolioId(portfolio)) {
    notFound();
  }

  const portfolioId = portfolio as PortfolioId;
  const meta = getPortfolioMeta(portfolioId);
  const valuta = meta.valuta;

  const categoriaDB = await getCategoriaBySlug(portfolioId, slug);

  if (!categoriaDB) {
    notFound();
  }

  const [, tuttiTitoliDB] = await Promise.all([
    getTitoliByCategoria(portfolioId, categoriaDB.id),
    getTitoli(portfolioId),
  ]);

  // Fetch prezzi live da Yahoo Finance per tutti i titoli (serve per peso % sul totale)
  const tickers = tuttiTitoliDB.map((t) => t.ticker);
  let prezziLive: Record<string, number | null> = {};
  let prezziTimestamp: number | null = null;

  try {
    const risultato = await getPrezziMultipli(tickers);
    prezziLive = risultato.prezzi;
    prezziTimestamp = risultato.timestamp;
  } catch {
    // Se Yahoo fallisce, si usano i dati del DB
  }

  // Arricchisci tutti i titoli con prezzi live per calcolare il totale portafoglio
  const tuttiTitoliAggiornati = tuttiTitoliDB.map((t) =>
    calcolaTitoloConPrezzoLive(t, prezziLive[t.ticker] ?? null)
  );
  const totalPortafoglio = tuttiTitoliAggiornati.reduce((s, t) => s + t.valoreAttuale, 0);

  // Filtra titoli della categoria e ricalcola con peso % sul totale portafoglio
  const titoliAggiornati = tuttiTitoliAggiornati.filter((t) => t.categoria === categoriaDB.id);
  const { categoria, titoli: titoliCategoria } = ricalcolaCategoriaConTitoli(
    categoriaDB,
    titoliAggiornati,
    totalPortafoglio
  );

  const totaleCosto = titoliCategoria.reduce((s, t) => s + t.costo, 0);
  const totaleValore = titoliCategoria.reduce((s, t) => s + t.valoreAttuale, 0);
  const totalePL = titoliCategoria.reduce((s, t) => s + t.profittoOPerdita, 0);
  const totaleDividendi = titoliCategoria.reduce((s, t) => s + t.dividendi, 0);
  const totalePLPerc = totaleCosto > 0 ? (totalePL / totaleCosto) * 100 : 0;
  const totalePesoPortafoglio = titoliCategoria.reduce((s, t) => s + t.pesoPercentuale, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-nero">{categoria.nome}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Peso sul portafoglio: {categoria.pesoPercentuale.toFixed(2)}%
          </p>
        </div>
        {prezziTimestamp && (
          <p className="text-xs text-gray-400">
            Prezzi aggiornati alle {formatOra(prezziTimestamp)}
          </p>
        )}
      </div>

      {/* Tabella titoli */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        {/* Mobile — lista stile Trade Republic */}
        <div className="md:hidden">
          {/* Totale */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div>
              <p className="font-semibold text-nero">Totale</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Costo: {formatValuta(totaleCosto, valuta)} &middot; Div: {formatValutaDecimali(totaleDividendi, valuta)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-nero">{formatValuta(totaleValore, valuta)}</p>
              <p className={`text-xs font-medium mt-0.5 ${colorePL(totalePLPerc)}`}>
                {formatPercentuale(totalePLPerc)} ({formatValutaDecimali(totalePL, valuta)})
              </p>
            </div>
          </div>

          {/* Titoli */}
          <div className="divide-y divide-gray-100">
            {titoliCategoria.map((titolo) => (
              <div key={titolo.ticker} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <TickerLogo ticker={titolo.ticker} nome={titolo.nome} size={32} />
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-verde-scuro text-sm">{titolo.ticker}</p>
                    <p className="text-xs text-gray-400 truncate">{titolo.nome}</p>
                  </div>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="font-medium text-nero text-sm">{formatValuta(titolo.valoreAttuale, valuta)}</p>
                  <p className={`text-xs font-medium ${colorePL(titolo.plPercentuale)}`}>
                    {formatPercentuale(titolo.plPercentuale)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop — tabella classica */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Titolo</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">N. Azioni</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">Prezzo Carico</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">Costo</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">Valore Attuale</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">Peso %</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">Dividendi</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">P&L</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">P&L %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {titoliCategoria.map((titolo) => (
                <tr key={titolo.ticker} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TickerLogo ticker={titolo.ticker} nome={titolo.nome} size={28} />
                      <div className="min-w-0">
                        <p className="font-mono font-semibold text-verde-scuro">{titolo.ticker}</p>
                        <p className="text-xs text-gray-400 truncate">{titolo.nome}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{formatNumero(titolo.numAzioni)}</td>
                  <td className="px-4 py-3 text-right">{formatValutaDecimali(titolo.prezzoMedioCarico, valuta)}</td>
                  <td className="px-4 py-3 text-right">{formatValuta(titolo.costo, valuta)}</td>
                  <td className="px-4 py-3 text-right">{formatValuta(titolo.valoreAttuale, valuta)}</td>
                  <td className="px-4 py-3 text-right">{titolo.pesoPercentuale.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right">
                    {titolo.dividendi > 0 ? formatValutaDecimali(titolo.dividendi, valuta) : "-"}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${colorePL(titolo.profittoOPerdita)}`}>
                    {formatValutaDecimali(titolo.profittoOPerdita, valuta)}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${colorePL(titolo.plPercentuale)}`}>
                    {formatPercentuale(titolo.plPercentuale)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3" colSpan={3}>Totale</td>
                <td className="px-4 py-3 text-right">{formatValuta(totaleCosto, valuta)}</td>
                <td className="px-4 py-3 text-right">{formatValuta(totaleValore, valuta)}</td>
                <td className="px-4 py-3 text-right">{totalePesoPortafoglio.toFixed(2)}%</td>
                <td className="px-4 py-3 text-right">{formatValutaDecimali(totaleDividendi, valuta)}</td>
                <td className={`px-4 py-3 text-right ${colorePL(totalePL)}`}>
                  {formatValutaDecimali(totalePL, valuta)}
                </td>
                <td className={`px-4 py-3 text-right ${colorePL(totalePLPerc)}`}>
                  {formatPercentuale(totalePLPerc)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
