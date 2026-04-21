"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ConfermaEliminazione from "@/components/admin/ConfermaEliminazione";
import { formatValutaDecimali, formatData } from "@/lib/format";
import type { DividendoConId, OperazioneConId } from "@/lib/db";
import type { PortfolioId } from "@/types/portafoglio";

export default function AdminTransazioni() {
  const [portfolio, setPortfolio] = useState<PortfolioId>("basic");
  const [dividendi, setDividendi] = useState<DividendoConId[]>([]);
  const [operazioni, setOperazioni] = useState<OperazioneConId[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  const [eliminazione, setEliminazione] = useState<{ id: number; tabella: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    caricaTransazioni();
  }, [portfolio]);

  async function caricaTransazioni() {
    try {
      const res = await fetch(`/api/admin/transazioni?portfolio=${portfolio}`);
      if (!res.ok) throw new Error("Errore nel caricamento delle transazioni");
      const data = await res.json();
      setDividendi(Array.isArray(data.dividendi) ? data.dividendi : []);
      setOperazioni(Array.isArray(data.operazioni) ? data.operazioni : []);
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setCaricamento(false);
    }
  }

  async function eliminaTransazione() {
    if (!eliminazione) return;
    setEliminando(true);
    try {
      await fetch(`/api/admin/transazioni/${eliminazione.id}?tabella=${eliminazione.tabella}&portfolio=${portfolio}`, {
        method: "DELETE",
      });
      if (eliminazione.tabella === "dividendi") {
        setDividendi((prev) => prev.filter((d) => d.id !== eliminazione.id));
      } else {
        setOperazioni((prev) => prev.filter((o) => o.id !== eliminazione.id));
      }
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
        <h1 className="text-2xl font-bold text-nero">Gestione Transazioni</h1>
        <Link
          href={`/admin/transazioni/nuova?portfolio=${portfolio}`}
          className="px-4 py-2 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors"
        >
          Nuova Transazione
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

      {/* Dividendi */}
      <h2 className="text-lg font-semibold text-nero mb-3">Dividendi ({dividendi.length})</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Data</th>
                <th className="px-4 py-3 font-medium text-gray-600">Ticker</th>
                <th className="px-4 py-3 font-medium text-gray-600">Descrizione</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Importo</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dividendi.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatData(d.data)}</td>
                  <td className="px-4 py-3 font-medium">{d.ticker}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{d.descrizione}</td>
                  <td className="px-4 py-3 text-right text-verde-guadagno font-medium">
                    {formatValutaDecimali(d.importo)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setEliminazione({ id: d.id, tabella: "dividendi" })}
                      className="px-3 py-1 text-xs font-medium text-rosso-perdita bg-red-50 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {dividendi.length === 0 && (
          <div className="text-center py-6 text-gray-500">Nessun dividendo registrato</div>
        )}
      </div>

      {/* Operazioni */}
      <h2 className="text-lg font-semibold text-nero mb-3">Operazioni ({operazioni.length})</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Data</th>
                <th className="px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="px-4 py-3 font-medium text-gray-600">Ticker</th>
                <th className="px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Azioni</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Prezzo Acq.</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Prezzo Vend.</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {operazioni.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatData(o.data)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        o.tipo === "vendita"
                          ? "bg-red-50 text-rosso-perdita"
                          : "bg-green-50 text-verde-guadagno"
                      }`}
                    >
                      {o.tipo === "vendita" ? "Vendita" : "Acquisto"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{o.ticker}</td>
                  <td className="px-4 py-3 text-gray-500">{o.nome}</td>
                  <td className="px-4 py-3 text-right">
                    {o.tipo === "vendita" ? o.azioniVendute : o.azioniComprate}
                  </td>
                  <td className="px-4 py-3 text-right">{formatValutaDecimali(o.prezzoAcquisto)}</td>
                  <td className="px-4 py-3 text-right">
                    {o.tipo === "vendita" && o.prezzoVendita != null
                      ? formatValutaDecimali(o.prezzoVendita)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setEliminazione({ id: o.id, tabella: "operazioni" })}
                      className="px-3 py-1 text-xs font-medium text-rosso-perdita bg-red-50 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {operazioni.length === 0 && (
          <div className="text-center py-6 text-gray-500">Nessuna operazione registrata</div>
        )}
      </div>

      <ConfermaEliminazione
        aperto={!!eliminazione}
        titolo="Elimina Transazione"
        messaggio="Sei sicuro di voler eliminare questa transazione? Questa azione non può essere annullata."
        onConferma={eliminaTransazione}
        onAnnulla={() => setEliminazione(null)}
        caricamento={eliminando}
      />
    </div>
  );
}
