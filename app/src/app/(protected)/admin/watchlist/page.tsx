"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { WatchlistItem } from "@/types/portafoglio";
import ConfermaEliminazione from "@/components/admin/ConfermaEliminazione";
import { formatValuta } from "@/lib/format";

function ratingBadge(rating: WatchlistItem["rating"]) {
  if (!rating) return <span className="text-gray-400">-</span>;
  const classi: Record<string, string> = {
    buy: "bg-green-100 text-verde-guadagno",
    hold: "bg-amber-100 text-amber-700",
    sell: "bg-red-100 text-rosso-perdita",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${classi[rating]}`}>
      {rating.charAt(0).toUpperCase() + rating.slice(1)}
    </span>
  );
}

export default function AdminWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  const [eliminazione, setEliminazione] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    caricaItems();
  }, []);

  async function caricaItems() {
    try {
      const res = await fetch("/api/admin/watchlist");
      if (!res.ok) throw new Error("Errore nel caricamento della watchlist");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setCaricamento(false);
    }
  }

  async function eliminaItem() {
    if (eliminazione === null) return;
    setEliminando(true);
    try {
      const res = await fetch(`/api/admin/watchlist/${eliminazione}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
      setItems((prev) => prev.filter((item) => item.id !== eliminazione));
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore nell'eliminazione");
    } finally {
      setEliminando(false);
      setEliminazione(null);
    }
  }

  if (caricamento) {
    return <div className="text-center py-12 text-gray-500">Caricamento...</div>;
  }

  if (errore) {
    return <div className="text-center py-12 text-rosso-perdita">{errore}</div>;
  }

  const itemDaEliminare = items.find((i) => i.id === eliminazione);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-nero">Gestione Watchlist</h1>
        <Link
          href="/admin/watchlist/nuovo"
          className="px-4 py-2 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors"
        >
          Aggiungi alla Watchlist
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Ticker</th>
                <th className="px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="px-4 py-3 font-medium text-gray-600">Settore</th>
                <th className="px-4 py-3 font-medium text-gray-600">Paese</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-center">Rating</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Target Price</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-nero">{item.ticker}</td>
                  <td className="px-4 py-3 text-gray-700">{item.nome}</td>
                  <td className="px-4 py-3 text-gray-500">{item.settore}</td>
                  <td className="px-4 py-3 text-gray-500">{item.paese}</td>
                  <td className="px-4 py-3 text-center">{ratingBadge(item.rating)}</td>
                  <td className="px-4 py-3 text-right">
                    {item.targetPrice !== null ? formatValuta(item.targetPrice) : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/admin/watchlist/nuovo?id=${item.id}`}
                        className="px-3 py-1 text-xs font-medium text-verde-scuro bg-verde-primario/10 rounded-md hover:bg-verde-primario/20 transition-colors"
                      >
                        Modifica
                      </Link>
                      <button
                        onClick={() => setEliminazione(item.id)}
                        className="px-3 py-1 text-xs font-medium text-rosso-perdita bg-red-50 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">Nessun elemento nella watchlist</div>
        )}
      </div>

      <ConfermaEliminazione
        aperto={eliminazione !== null}
        titolo="Elimina dalla Watchlist"
        messaggio={`Sei sicuro di voler eliminare ${itemDaEliminare?.ticker ?? ""} dalla watchlist? Questa azione non può essere annullata.`}
        onConferma={eliminaItem}
        onAnnulla={() => setEliminazione(null)}
        caricamento={eliminando}
      />
    </div>
  );
}
