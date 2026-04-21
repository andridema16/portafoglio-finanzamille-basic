"use client";

import { useState, useMemo, Fragment } from "react";
import type { WatchlistItem } from "@/types/portafoglio";
import WatchlistDrawer from "@/components/WatchlistDrawer";
import TickerLogo from "@/components/TickerLogo";
import { formatValuta, formatPercentuale, colorePL } from "@/lib/format";

const ETICHETTE_SETTORE: Record<string, string> = {
  energia: "Energia",
  "risorse-naturali": "Risorse Naturali",
  tecnologia: "Tecnologia",
  finanza: "Finanza",
  consumer: "Consumer",
  trasporti: "Trasporti",
  utilities: "Utilities",
  sanita: "Sanità",
  "metalli-preziosi": "Metalli Preziosi",
  crypto: "Crypto",
  obbligazionario: "Obbligazionario",
  "small-cap": "Small Cap",
  diversificato: "Diversificato",
  difesa: "Difesa",
  immobiliare: "Immobiliare",
};

interface WatchlistPrezzoData {
  prezzoAttuale: number | null;
  ytdPercentuale: number | null;
}

interface Props {
  items: WatchlistItem[];
  prezziData: Record<string, WatchlistPrezzoData>;
  prezziTimestamp: number | null;
}

function RatingBadge({ rating }: { rating: WatchlistItem["rating"] }) {
  if (!rating) return null;

  const classi: Record<string, string> = {
    buy: "bg-green-100 text-verde-guadagno",
    hold: "bg-amber-100 text-amber-700",
    sell: "bg-red-100 text-rosso-perdita",
  };

  const etichette: Record<string, string> = {
    buy: "Buy",
    hold: "Hold",
    sell: "Sell",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classi[rating]}`}>
      {etichette[rating]}
    </span>
  );
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const ore = d.getHours().toString().padStart(2, "0");
  const minuti = d.getMinutes().toString().padStart(2, "0");
  return `${ore}:${minuti}`;
}

export default function WatchlistGrid({ items, prezziData, prezziTimestamp }: Props) {
  const [ricerca, setRicerca] = useState("");
  const [filtroSettore, setFiltroSettore] = useState("");
  const [filtroPaese, setFiltroPaese] = useState("");
  const [filtroRating, setFiltroRating] = useState("");
  const [itemSelezionato, setItemSelezionato] = useState<WatchlistItem | null>(null);

  const settoriUnici = useMemo(
    () => [...new Set(items.map((i) => i.settore))].sort(),
    [items]
  );

  const paesiUnici = useMemo(
    () => [...new Set(items.map((i) => i.paese))].sort(),
    [items]
  );

  const filtrati = useMemo(() => {
    return items.filter((item) => {
      if (ricerca) {
        const q = ricerca.toLowerCase();
        if (!item.ticker.toLowerCase().includes(q) && !item.nome.toLowerCase().includes(q)) return false;
      }
      if (filtroSettore && item.settore !== filtroSettore) return false;
      if (filtroPaese && item.paese !== filtroPaese) return false;
      if (filtroRating && item.rating !== filtroRating) return false;
      return true;
    });
  }, [items, ricerca, filtroSettore, filtroPaese, filtroRating]);

  const raggruppati = useMemo(() => {
    const mappa = new Map<string, WatchlistItem[]>();
    for (const item of filtrati) {
      const gruppo = mappa.get(item.settore) || [];
      gruppo.push(item);
      mappa.set(item.settore, gruppo);
    }
    return mappa;
  }, [filtrati]);

  const filtriAttivi = ricerca || filtroSettore || filtroPaese || filtroRating;

  function resettaFiltri() {
    setRicerca("");
    setFiltroSettore("");
    setFiltroPaese("");
    setFiltroRating("");
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-nero">Watchlist</h1>
        <p className="text-nero/60 text-sm mt-1">Titoli sotto osservazione</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          placeholder="Cerca ticker o nome..."
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-verde-scuro/30 w-full sm:w-auto sm:min-w-[220px]"
        />

        <select
          value={filtroSettore}
          onChange={(e) => setFiltroSettore(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-verde-scuro/30"
        >
          <option value="">Tutti i settori</option>
          {settoriUnici.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filtroPaese}
          onChange={(e) => setFiltroPaese(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-verde-scuro/30"
        >
          <option value="">Tutti i paesi</option>
          {paesiUnici.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={filtroRating}
          onChange={(e) => setFiltroRating(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-verde-scuro/30"
        >
          <option value="">Tutti i rating</option>
          <option value="buy">Buy</option>
          <option value="hold">Hold</option>
          <option value="sell">Sell</option>
        </select>

        {filtriAttivi && (
          <button
            onClick={resettaFiltri}
            className="px-3 py-2 text-sm text-verde-scuro hover:text-verde-scuro/80 transition-colors cursor-pointer"
          >
            Resetta
          </button>
        )}
      </div>

      {/* Results count + timestamp */}
      <div className="mb-4">
        <p className="text-sm text-nero/50">
          {filtriAttivi
            ? `${filtrati.length} di ${items.length} titoli`
            : `${items.length} titoli`}
        </p>
        {prezziTimestamp != null && (
          <p className="text-xs text-nero/40 mt-0.5">
            Prezzi aggiornati alle {formatTimestamp(prezziTimestamp)}
          </p>
        )}
      </div>

      {/* List */}
      {filtrati.length === 0 ? (
        <div className="text-center py-16 text-nero/50">
          Nessun titolo corrisponde ai filtri
        </div>
      ) : (
        <div className="flex flex-col">
          {[...raggruppati.entries()].map(([settore, items], idx) => (
            <Fragment key={settore}>
              {/* Sector header */}
              <div className={`bg-verde-scuro px-4 py-2.5 rounded-t-xl ${idx > 0 ? "mt-4" : ""}`}>
                <div className="flex items-center justify-between text-white">
                  <span className="font-semibold text-sm">
                    {ETICHETTE_SETTORE[settore] ?? settore}
                  </span>
                  <span className="text-xs text-white/70">
                    {items.length} {items.length === 1 ? "titolo" : "titoli"}
                  </span>
                </div>
              </div>
              {/* Items */}
              <div className="bg-white rounded-b-xl shadow-sm divide-y divide-gray-100 mb-3">
                {items.map((item) => {
                  const prezzo = prezziData[item.ticker];
                  const prezzoAttuale = prezzo?.prezzoAttuale ?? null;
                  const ytd = prezzo?.ytdPercentuale ?? null;

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setItemSelezionato(item); } }}
                      onClick={() => setItemSelezionato(item)}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-verde-scuro/50 transition-colors"
                    >
                      {/* Desktop layout */}
                      <div className="hidden md:flex items-center gap-4">
                        {/* Logo */}
                        <TickerLogo ticker={item.ticker} nome={item.nome} size={36} />

                        {/* Ticker + Nome */}
                        <div className="min-w-[140px]">
                          <span className="font-bold text-nero">{item.ticker}</span>
                          <p className="text-xs text-nero/60 truncate">{item.nome}</p>
                        </div>

                        {/* Rating + Tags */}
                        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                          <RatingBadge rating={item.rating} />
                          <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 text-xs whitespace-nowrap">
                            {item.paese}
                          </span>
                        </div>

                        {/* Target price */}
                        {item.targetPrice != null && (
                          <span className="text-xs text-nero/50 whitespace-nowrap ml-auto">
                            Target: {formatValuta(item.targetPrice)}
                          </span>
                        )}

                        {/* Price */}
                        <span className={`font-semibold text-sm whitespace-nowrap ${item.targetPrice == null ? "ml-auto" : ""}`}>
                          {prezzoAttuale != null ? formatValuta(prezzoAttuale) : "-"}
                        </span>

                        {/* YTD */}
                        {ytd != null && (
                          <span className={`text-sm font-medium whitespace-nowrap ${colorePL(ytd)}`}>
                            {formatPercentuale(ytd)} YTD
                          </span>
                        )}

                        {/* Vedi articolo */}
                        {item.metricheExtra?.linkNewsletter && (
                          <a
                            href={String(item.metricheExtra.linkNewsletter)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
                            className="text-xs text-verde-scuro hover:text-verde-scuro/80 font-medium whitespace-nowrap transition-colors"
                          >
                            Vedi articolo
                          </a>
                        )}

                        {/* Chevron */}
                        <svg className="w-4 h-4 text-nero/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      {/* Mobile layout */}
                      <div className="flex md:hidden flex-col gap-1.5">
                        {/* Row 1 */}
                        <div className="flex items-center gap-3">
                          <TickerLogo ticker={item.ticker} nome={item.nome} size={32} />
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-bold text-nero">{item.ticker}</span>
                            <span className="text-xs text-nero/60 truncate">{item.nome}</span>
                          </div>
                          <span className="font-semibold text-sm whitespace-nowrap">
                            {prezzoAttuale != null ? formatValuta(prezzoAttuale) : "-"}
                          </span>
                          <svg className="w-4 h-4 text-nero/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>

                        {/* Row 2 */}
                        <div className="flex items-center gap-2 pl-[44px]">
                          <RatingBadge rating={item.rating} />
                          <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 text-xs">
                            {item.paese}
                          </span>
                          <span className="flex-1" />
                          {ytd != null && (
                            <span className={`text-xs font-medium whitespace-nowrap ${colorePL(ytd)}`}>
                              {formatPercentuale(ytd)} YTD
                            </span>
                          )}
                        </div>

                        {/* Row 3: target + link (only if present) */}
                        {(item.targetPrice != null || item.metricheExtra?.linkNewsletter) && (
                          <div className="flex items-center gap-2 pl-[44px]">
                            {item.targetPrice != null && (
                              <span className="text-xs text-nero/50">
                                Target: {formatValuta(item.targetPrice)}
                              </span>
                            )}
                            <span className="flex-1" />
                            {item.metricheExtra?.linkNewsletter && (
                              <a
                                href={String(item.metricheExtra.linkNewsletter)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
                                className="text-xs text-verde-scuro hover:text-verde-scuro/80 font-medium transition-colors"
                              >
                                Vedi articolo
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Fragment>
          ))}
        </div>
      )}

      {/* Drawer */}
      <WatchlistDrawer
        item={itemSelezionato}
        aperto={itemSelezionato !== null}
        onChiudi={() => setItemSelezionato(null)}
        prezzoAttuale={itemSelezionato ? prezziData[itemSelezionato.ticker]?.prezzoAttuale ?? null : null}
        ytdPercentuale={itemSelezionato ? prezziData[itemSelezionato.ticker]?.ytdPercentuale ?? null : null}
      />
    </>
  );
}
