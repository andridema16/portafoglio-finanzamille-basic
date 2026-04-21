"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Titolo, AssetClass, Paese, Settore, PortfolioId } from "@/types/portafoglio";

const ASSET_CLASSES: AssetClass[] = ["azione", "etf", "obbligazione", "crypto", "metallo"];

const PAESI: Paese[] = [
  "USA", "Canada", "UK", "Francia", "Svizzera", "India", "Brasile",
  "Messico", "Colombia", "Panama", "Europa", "Asia-Pacifico",
  "Sud-Est Asiatico", "Mercati Emergenti", "America Latina", "Globale",
];

const SETTORI: Settore[] = [
  "energia", "risorse-naturali", "tecnologia", "finanza", "sanita",
  "consumer", "trasporti", "utilities", "metalli-preziosi", "crypto",
  "obbligazionario", "small-cap", "diversificato",
];

interface Props {
  titolo?: Titolo;
  categorie: { id: string; nome: string }[];
  portfolioId?: PortfolioId;
}

export default function FormTitolo({ titolo, categorie, portfolioId = "basic" }: Props) {
  const router = useRouter();
  const isModifica = !!titolo;

  const [form, setForm] = useState({
    ticker: titolo?.ticker ?? "",
    nome: titolo?.nome ?? "",
    categoria: titolo?.categoria ?? (categorie[0]?.id ?? ""),
    numAzioni: titolo?.numAzioni ?? 0,
    prezzoMedioCarico: titolo?.prezzoMedioCarico ?? 0,
    assetClass: titolo?.assetClass ?? ("azione" as AssetClass),
    paese: titolo?.paese ?? ("USA" as Paese),
    settore: titolo?.settore ?? ("energia" as Settore),
    isin: titolo?.isin ?? "",
    dividendi: titolo?.dividendi ?? 0,
    peRatio: titolo?.peRatio ?? 0,
  });
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  const costo = form.numAzioni * form.prezzoMedioCarico;

  function aggiorna(campo: string, valore: string | number) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  async function invio(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    setCaricamento(true);

    try {
      const payload = {
        ...form,
        portfolioId,
        isin: form.isin.trim() || null,
        peRatio: form.peRatio !== 0 ? form.peRatio : null,
      };

      const url = isModifica
        ? `/api/admin/titoli/${titolo.ticker}?portfolio=${portfolioId}`
        : `/api/admin/titoli?portfolio=${portfolioId}`;
      const method = isModifica ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Errore nel salvataggio");
      }

      router.push("/admin/titoli");
      router.refresh();
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setCaricamento(false);
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-primario/50 focus:border-verde-primario";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={invio} className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Ticker</label>
          <input
            type="text"
            value={form.ticker}
            onChange={(e) => aggiorna("ticker", e.target.value.toUpperCase())}
            disabled={isModifica}
            required
            className={`${inputClass} ${isModifica ? "bg-gray-100" : ""}`}
            placeholder="Es. AAPL"
          />
        </div>

        <div>
          <label className={labelClass}>Nome</label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => aggiorna("nome", e.target.value)}
            required
            className={inputClass}
            placeholder="Es. Apple Inc"
          />
        </div>

        <div>
          <label className={labelClass}>Categoria</label>
          <select
            value={form.categoria}
            onChange={(e) => aggiorna("categoria", e.target.value)}
            required
            className={inputClass}
          >
            {categorie.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>N. Azioni</label>
          <input
            type="number"
            step="0.01"
            value={form.numAzioni}
            onChange={(e) => aggiorna("numAzioni", Number(e.target.value))}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Prezzo Medio Carico ($)</label>
          <input
            type="number"
            step="0.01"
            value={form.prezzoMedioCarico}
            onChange={(e) => aggiorna("prezzoMedioCarico", Number(e.target.value))}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Costo (calcolato)</label>
          <input
            type="text"
            value={`$${costo.toFixed(2)}`}
            disabled
            className={`${inputClass} bg-gray-100`}
          />
        </div>

        <div>
          <label className={labelClass}>Asset Class</label>
          <select
            value={form.assetClass}
            onChange={(e) => aggiorna("assetClass", e.target.value)}
            required
            className={inputClass}
          >
            {ASSET_CLASSES.map((ac) => (
              <option key={ac} value={ac}>{ac.charAt(0).toUpperCase() + ac.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Paese</label>
          <select
            value={form.paese}
            onChange={(e) => aggiorna("paese", e.target.value)}
            required
            className={inputClass}
          >
            {PAESI.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Settore</label>
          <select
            value={form.settore}
            onChange={(e) => aggiorna("settore", e.target.value)}
            required
            className={inputClass}
          >
            {SETTORI.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>ISIN (opzionale)</label>
          <input
            type="text"
            value={form.isin}
            onChange={(e) => aggiorna("isin", e.target.value)}
            className={inputClass}
            placeholder="Es. US0378331005"
          />
        </div>

        <div>
          <label className={labelClass}>Dividendi ($)</label>
          <input
            type="number"
            step="0.01"
            value={form.dividendi}
            onChange={(e) => aggiorna("dividendi", Number(e.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>P/E Ratio (opzionale)</label>
          <input
            type="number"
            step="0.01"
            value={form.peRatio}
            onChange={(e) => aggiorna("peRatio", Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      {errore && (
        <p className="mt-4 text-sm text-rosso-perdita">{errore}</p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={caricamento}
          className="px-6 py-2.5 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          {caricamento ? "Salvataggio..." : isModifica ? "Salva Modifiche" : "Aggiungi Titolo"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/titoli")}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}
