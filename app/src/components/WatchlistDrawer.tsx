"use client";

import { useEffect } from "react";
import type { WatchlistItem } from "@/types/portafoglio";
import { formatValuta, formatPercentuale, colorePL } from "@/lib/format";

interface Props {
  item: WatchlistItem | null;
  aperto: boolean;
  onChiudi: () => void;
  prezzoAttuale?: number | null;
  ytdPercentuale?: number | null;
}

function RatingBadgeLarge({ rating }: { rating: WatchlistItem["rating"] }) {
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
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${classi[rating]}`}>
      {etichette[rating]}
    </span>
  );
}

export default function WatchlistDrawer({ item, aperto, onChiudi, prezzoAttuale, ytdPercentuale }: Props) {
  // Scroll-lock: depends only on `aperto` so it works even when item is null
  useEffect(() => {
    if (!aperto) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [aperto]);

  // Close on Escape key
  useEffect(() => {
    if (!aperto) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onChiudi();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); };
  }, [aperto, onChiudi]);

  if (!item) return null;

  const mostraAnalisi =
    prezzoAttuale != null ||
    ytdPercentuale != null ||
    item.rating != null ||
    item.targetPrice != null ||
    item.peRatio != null ||
    item.dividendYield != null;

  const linkNewsletter = Object.entries(item.metricheExtra ?? {})
    .filter(([k]) => k.startsWith("linkNewsletter"))
    .map(([, v]) => String(v));

  const metricheEntries = Object.entries(item.metricheExtra ?? {})
    .filter(([k]) => !k.startsWith("linkNewsletter"));

  return (
    <>
      {/* Overlay */}
      {aperto && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onChiudi}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg bg-white shadow-xl transform transition-transform duration-300 ${
          aperto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="overflow-y-auto h-full">
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-nero">{item.ticker}</h2>
              <p className="text-sm text-nero/60">{item.nome}</p>
            </div>
            <button
              onClick={onChiudi}
              className="p-1 text-nero/40 hover:text-nero transition-colors cursor-pointer"
              aria-label="Chiudi"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-6">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 text-xs">
                {item.assetClass}
              </span>
              <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 text-xs">
                {item.settore}
              </span>
              <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 text-xs">
                {item.paese}
              </span>
            </div>

            {/* Link Newsletter */}
            {linkNewsletter.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {linkNewsletter.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-verde-scuro text-white text-sm font-medium rounded-lg hover:bg-verde-scuro/90 transition-colors"
                  >
                    Vedi articolo{linkNewsletter.length > 1 ? ` ${i + 1}` : ""}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            )}

            {/* Descrizione */}
            {item.descrizione && (
              <div>
                <p className="text-sm font-semibold text-nero/50 uppercase tracking-wider mb-2">
                  Descrizione
                </p>
                <p className="text-sm leading-relaxed text-nero/80">
                  {item.descrizione}
                </p>
              </div>
            )}

            {/* Analisi */}
            {mostraAnalisi && (
              <div>
                <p className="text-sm font-semibold text-nero/50 uppercase tracking-wider mb-2">
                  Analisi
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {prezzoAttuale != null && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-nero/50 mb-1">Prezzo Attuale</p>
                      <p className="text-lg font-semibold text-nero">{formatValuta(prezzoAttuale)}</p>
                    </div>
                  )}
                  {ytdPercentuale != null && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-nero/50 mb-1">YTD</p>
                      <p className={`text-lg font-semibold ${colorePL(ytdPercentuale)}`}>
                        {formatPercentuale(ytdPercentuale)}
                      </p>
                    </div>
                  )}
                  {item.rating != null && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-nero/50 mb-1">Rating</p>
                      <RatingBadgeLarge rating={item.rating} />
                    </div>
                  )}
                  {item.targetPrice != null && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-nero/50 mb-1">Target Price</p>
                      <p className="text-lg font-semibold text-nero">${item.targetPrice.toFixed(2)}</p>
                    </div>
                  )}
                  {item.peRatio != null && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-nero/50 mb-1">P/E Ratio</p>
                      <p className="text-lg font-semibold text-nero">{item.peRatio.toFixed(2)}</p>
                    </div>
                  )}
                  {item.dividendYield != null && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-nero/50 mb-1">Dividend Yield</p>
                      <p className="text-lg font-semibold text-nero">{item.dividendYield.toFixed(2)}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metriche Extra */}
            {metricheEntries.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-nero/50 uppercase tracking-wider mb-2">
                  Metriche Aggiuntive
                </p>
                <div className="border rounded-lg divide-y">
                  {metricheEntries.map(([chiave, valore]) => (
                    <div key={chiave} className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-nero/60">{chiave}</span>
                      <span className="font-medium text-nero">{valore}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analisi Dettagliata */}
            {item.analisiTesto && (
              <div>
                <p className="text-sm font-semibold text-nero/50 uppercase tracking-wider mb-2">
                  Analisi di Approfondimento
                </p>
                <p className="text-sm leading-relaxed text-nero/80 whitespace-pre-wrap">
                  {item.analisiTesto}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
