"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Titolo, PortfolioId } from "@/types/portafoglio";
import ConfermaEliminazione from "@/components/admin/ConfermaEliminazione";
import { formatValuta, formatPercentuale, colorePL } from "@/lib/format";

export default function AdminTitoli() {
  const [portfolio, setPortfolio] = useState<PortfolioId>("basic");
  const [titoli, setTitoli] = useState<Titolo[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  const [eliminazione, setEliminazione] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    caricaTitoli();
  }, [portfolio]);

  async function caricaTitoli() {
    try {
      const res = await fetch(`/api/admin/titoli?portfolio=${portfolio}`);
      if (!res.ok) throw new Error("Errore nel caricamento dei titoli");
      const data = await res.json();
      setTitoli(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setCaricamento(false);
    }
  }

  async function eliminaTitolo() {
    if (!eliminazione) return;
    setEliminando(true);
    try {
      await fetch(`/api/admin/titoli/${eliminazione}?portfolio=${portfolio}`, { method: "DELETE" });
      setTitoli((prev) => prev.filter((t) => t.ticker !== eliminazione));
    } catch {
      // gestione errore silenziosa
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-nero">Gestione Titoli</h1>
        <Link
          href={`/admin/titoli/nuovo?portfolio=${portfolio}`}
          className="px-4 py-2 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors"
        >
          Aggiungi Titolo
        </Link>
      </div>

      {/* Selettore Portafoglio */}
      <div className="flex gap-2 mb-6">
        {(["basic"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPortfolio(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              portfolio === p
                ? "bg-verde-scuro text-white"
                : "bg-white text-nero/60 hover:bg-gray-100"
            }`}
          >
            {"Basic"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Ticker</th>
                <th className="px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="px-4 py-3 font-medium text-gray-600">Categoria</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">N. Azioni</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Costo</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Valore</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">P&L%</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {titoli.map((t) => (
                <tr key={t.ticker} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-nero">{t.ticker}</td>
                  <td className="px-4 py-3 text-gray-700">{t.nome}</td>
                  <td className="px-4 py-3 text-gray-500">{t.categoria}</td>
                  <td className="px-4 py-3 text-right">{t.numAzioni}</td>
                  <td className="px-4 py-3 text-right">{formatValuta(t.costo)}</td>
                  <td className="px-4 py-3 text-right">{formatValuta(t.valoreAttuale)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${colorePL(t.plPercentuale)}`}>
                    {formatPercentuale(t.plPercentuale)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/admin/titoli/${t.ticker}/modifica?portfolio=${portfolio}`}
                        className="px-3 py-1 text-xs font-medium text-verde-scuro bg-verde-primario/10 rounded-md hover:bg-verde-primario/20 transition-colors"
                      >
                        Modifica
                      </Link>
                      <button
                        onClick={() => setEliminazione(t.ticker)}
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
        {titoli.length === 0 && (
          <div className="text-center py-8 text-gray-500">Nessun titolo presente</div>
        )}
      </div>

      <ConfermaEliminazione
        aperto={!!eliminazione}
        titolo="Elimina Titolo"
        messaggio={`Sei sicuro di voler eliminare il titolo ${eliminazione}? Questa azione non può essere annullata.`}
        onConferma={eliminaTitolo}
        onAnnulla={() => setEliminazione(null)}
        caricamento={eliminando}
      />
    </div>
  );
}
