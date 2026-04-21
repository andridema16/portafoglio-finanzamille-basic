"use client";

import { useState, useEffect } from "react";
import ConfermaEliminazione from "@/components/admin/ConfermaEliminazione";
import { formatValutaDecimali, formatData } from "@/lib/format";
import type { FlussoCapitale, PortfolioId } from "@/types/portafoglio";

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-primario/50 focus:border-verde-primario";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

function badgeTipo(tipo: FlussoCapitale["tipo"]) {
  if (tipo === "deposito") return "bg-green-50 text-verde-guadagno";
  if (tipo === "prelievo") return "bg-red-50 text-rosso-perdita";
  return "bg-gray-100 text-gray-600";
}

function labelTipo(tipo: FlussoCapitale["tipo"]) {
  if (tipo === "deposito") return "Deposito";
  if (tipo === "prelievo") return "Prelievo";
  return "Inizio";
}

export default function AdminFlussi() {
  const [portfolio, setPortfolio] = useState<PortfolioId>("basic");
  const [flussi, setFlussi] = useState<FlussoCapitale[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  const [eliminazione, setEliminazione] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [invio, setInvio] = useState(false);
  const [erroreForm, setErroreForm] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    data: new Date().toISOString().slice(0, 10),
    tipo: "deposito" as "deposito" | "prelievo",
    importo: "",
    valorePre: "",
    capitalePost: "",
    nota: "",
  });

  useEffect(() => {
    caricaFlussi();
  }, [portfolio]);

  async function caricaFlussi() {
    try {
      const res = await fetch(`/api/admin/flussi?portfolio=${portfolio}`);
      if (!res.ok) throw new Error("Errore nel caricamento dei flussi");
      const data = await res.json();
      setFlussi(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setCaricamento(false);
    }
  }

  async function aggiungiFlusso(e: React.FormEvent) {
    e.preventDefault();
    setErroreForm(null);

    if (!formData.data || !formData.importo || !formData.valorePre || !formData.capitalePost) {
      setErroreForm("Compila tutti i campi obbligatori");
      return;
    }

    setInvio(true);
    try {
      const res = await fetch("/api/admin/flussi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId: portfolio,
          data: formData.data,
          tipo: formData.tipo,
          importo: Number(formData.importo),
          valorePre: Number(formData.valorePre),
          capitalePost: Number(formData.capitalePost),
          nota: formData.nota,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Errore nella creazione");
      }

      // Reset form e ricarica
      setFormData({
        data: new Date().toISOString().slice(0, 10),
        tipo: "deposito",
        importo: "",
        valorePre: "",
        capitalePost: "",
        nota: "",
      });
      await caricaFlussi();
    } catch (err) {
      setErroreForm(err instanceof Error ? err.message : "Errore nella creazione");
    } finally {
      setInvio(false);
    }
  }

  async function eliminaFlusso() {
    if (eliminazione == null) return;
    setEliminando(true);
    try {
      const res = await fetch(`/api/admin/flussi/${eliminazione}?portfolio=${portfolio}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Errore nell'eliminazione");
      }
      setFlussi((prev) => prev.filter((f) => f.id !== eliminazione));
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
      <h1 className="text-2xl font-bold text-nero mb-6">Gestione Flussi di Capitale</h1>

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

      {/* Form nuovo flusso */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-nero mb-4">Nuovo Flusso</h2>
        <form onSubmit={aggiungiFlusso}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Data *</label>
              <input
                type="date"
                className={inputClass}
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tipo *</label>
              <select
                className={inputClass}
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value as "deposito" | "prelievo" })
                }
              >
                <option value="deposito">Deposito</option>
                <option value="prelievo">Prelievo</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Importo ($) *</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={formData.importo}
                onChange={(e) => setFormData({ ...formData, importo: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Valore Pre ($) *</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={formData.valorePre}
                onChange={(e) => setFormData({ ...formData, valorePre: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Capitale Post ($) *</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={formData.capitalePost}
                onChange={(e) => setFormData({ ...formData, capitalePost: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Nota</label>
              <input
                type="text"
                className={inputClass}
                value={formData.nota}
                onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                placeholder="Nota opzionale"
              />
            </div>
          </div>

          {erroreForm && (
            <div className="mt-3 text-sm text-rosso-perdita">{erroreForm}</div>
          )}

          <div className="mt-4">
            <button
              type="submit"
              disabled={invio}
              className="px-4 py-2 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {invio ? "Salvataggio..." : "Aggiungi Flusso"}
            </button>
          </div>
        </form>
      </div>

      {/* Tabella flussi */}
      <h2 className="text-lg font-semibold text-nero mb-3">Flussi ({flussi.length})</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Data</th>
                <th className="px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Importo</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Valore Pre</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Capitale Post</th>
                <th className="px-4 py-3 font-medium text-gray-600">Nota</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flussi.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatData(f.data)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${badgeTipo(f.tipo)}`}
                    >
                      {labelTipo(f.tipo)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatValutaDecimali(f.importo)}
                  </td>
                  <td className="px-4 py-3 text-right">{formatValutaDecimali(f.valorePre)}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatValutaDecimali(f.capitalePost)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{f.nota}</td>
                  <td className="px-4 py-3 text-center">
                    {f.tipo !== "inizio" ? (
                      <button
                        onClick={() => setEliminazione(f.id)}
                        className="px-3 py-1 text-xs font-medium text-rosso-perdita bg-red-50 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        Elimina
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {flussi.length === 0 && (
          <div className="text-center py-6 text-gray-500">Nessun flusso registrato</div>
        )}
      </div>

      <ConfermaEliminazione
        aperto={eliminazione != null}
        titolo="Elimina Flusso"
        messaggio="Sei sicuro di voler eliminare questo flusso di capitale? Questa azione non può essere annullata."
        onConferma={eliminaFlusso}
        onAnnulla={() => setEliminazione(null)}
        caricamento={eliminando}
      />
    </div>
  );
}
