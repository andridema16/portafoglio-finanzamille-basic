"use client";

import { useState, useEffect } from "react";
import type { Categoria, PortfolioId } from "@/types/portafoglio";
import ConfermaEliminazione from "@/components/admin/ConfermaEliminazione";
import { formatValuta, formatPercentuale, colorePL } from "@/lib/format";

export default function AdminCategorie() {
  const [portfolio, setPortfolio] = useState<PortfolioId>("basic");
  const [categorie, setCategorie] = useState<Categoria[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  const [eliminazione, setEliminazione] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Form nuova categoria
  const [mostraForm, setMostraForm] = useState(false);
  const [modificaId, setModificaId] = useState<string | null>(null);
  const [formId, setFormId] = useState("");
  const [formNome, setFormNome] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroreForm, setErroreForm] = useState("");

  useEffect(() => {
    caricaCategorie();
  }, [portfolio]);

  async function caricaCategorie() {
    try {
      const res = await fetch(`/api/admin/categorie?portfolio=${portfolio}`);
      if (!res.ok) throw new Error("Errore nel caricamento delle categorie");
      const data = await res.json();
      setCategorie(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setCaricamento(false);
    }
  }

  async function eliminaCategoria() {
    if (!eliminazione) return;
    setEliminando(true);
    try {
      await fetch(`/api/admin/categorie/${eliminazione}?portfolio=${portfolio}`, { method: "DELETE" });
      setCategorie((prev) => prev.filter((c) => c.id !== eliminazione));
    } catch {
      // gestione errore silenziosa
    } finally {
      setEliminando(false);
      setEliminazione(null);
    }
  }

  function iniziaModifica(cat: Categoria) {
    setModificaId(cat.id);
    setFormId(cat.id);
    setFormNome(cat.nome);
    setFormSlug(cat.slug);
    setMostraForm(true);
    setErroreForm("");
  }

  function iniziaNuova() {
    setModificaId(null);
    setFormId("");
    setFormNome("");
    setFormSlug("");
    setMostraForm(true);
    setErroreForm("");
  }

  function annullaForm() {
    setMostraForm(false);
    setModificaId(null);
    setErroreForm("");
  }

  async function salvaCategoria(e: React.FormEvent) {
    e.preventDefault();
    setErroreForm("");
    setSalvando(true);

    try {
      if (modificaId) {
        const res = await fetch(`/api/admin/categorie/${modificaId}?portfolio=${portfolio}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: formNome, slug: formSlug, portfolioId: portfolio }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Errore nel salvataggio");
        }
      } else {
        const res = await fetch(`/api/admin/categorie?portfolio=${portfolio}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: formId, nome: formNome, slug: formSlug, portfolioId: portfolio }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Errore nel salvataggio");
        }
      }

      annullaForm();
      caricaCategorie();
    } catch (err) {
      setErroreForm(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setSalvando(false);
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-primario/50 focus:border-verde-primario";

  if (caricamento) {
    return <div className="text-center py-12 text-gray-500">Caricamento...</div>;
  }

  if (errore) {
    return <div className="text-center py-12 text-rosso-perdita">{errore}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-nero">Gestione Categorie</h1>
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

      <div className="flex items-center justify-between mb-6">
        {!mostraForm && (
          <button
            onClick={iniziaNuova}
            className="px-4 py-2 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors cursor-pointer"
          >
            Aggiungi Categoria
          </button>
        )}
      </div>

      {/* Form inline */}
      {mostraForm && (
        <form onSubmit={salvaCategoria} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-nero mb-4">
            {modificaId ? "Modifica Categoria" : "Nuova Categoria"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
              <input
                type="text"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                disabled={!!modificaId}
                required
                className={`${inputClass} ${modificaId ? "bg-gray-100" : ""}`}
                placeholder="Es. growth"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                required
                className={inputClass}
                placeholder="Es. Growth"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                required
                className={inputClass}
                placeholder="Es. growth"
              />
            </div>
          </div>
          {erroreForm && (
            <p className="mt-3 text-sm text-rosso-perdita">{erroreForm}</p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              {salvando ? "Salvataggio..." : modificaId ? "Salva" : "Crea"}
            </button>
            <button
              type="button"
              onClick={annullaForm}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {/* Tabella categorie */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Peso %</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Valore</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">P&L%</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categorie.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.id}</td>
                  <td className="px-4 py-3 font-medium text-nero">{c.nome}</td>
                  <td className="px-4 py-3 text-gray-500">{c.slug}</td>
                  <td className="px-4 py-3 text-right">{c.pesoPercentuale.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right">{formatValuta(c.valoreAttuale)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${colorePL(c.plPercentuale)}`}>
                    {formatPercentuale(c.plPercentuale)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => iniziaModifica(c)}
                        className="px-3 py-1 text-xs font-medium text-verde-scuro bg-verde-primario/10 rounded-md hover:bg-verde-primario/20 transition-colors cursor-pointer"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => setEliminazione(c.id)}
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
        {categorie.length === 0 && (
          <div className="text-center py-8 text-gray-500">Nessuna categoria presente</div>
        )}
      </div>

      <ConfermaEliminazione
        aperto={!!eliminazione}
        titolo="Elimina Categoria"
        messaggio={`Sei sicuro di voler eliminare la categoria "${eliminazione}"? Tutti i titoli associati rimarranno senza categoria.`}
        onConferma={eliminaCategoria}
        onAnnulla={() => setEliminazione(null)}
        caricamento={eliminando}
      />
    </div>
  );
}
