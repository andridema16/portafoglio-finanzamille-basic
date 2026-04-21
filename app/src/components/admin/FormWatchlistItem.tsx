"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WatchlistItem, AssetClass, Paese, Settore, WatchlistRating } from "@/types/portafoglio";

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

const RATINGS: { value: "" | WatchlistRating; label: string }[] = [
  { value: "", label: "Nessuno" },
  { value: "buy", label: "Buy" },
  { value: "hold", label: "Hold" },
  { value: "sell", label: "Sell" },
];

interface Props {
  item?: WatchlistItem;
}

export default function FormWatchlistItem({ item }: Props) {
  const router = useRouter();
  const isModifica = !!item;

  const [form, setForm] = useState({
    ticker: item?.ticker ?? "",
    tickerYahoo: item?.tickerYahoo ?? "",
    nome: item?.nome ?? "",
    settore: item?.settore ?? ("energia" as Settore),
    paese: item?.paese ?? ("USA" as Paese),
    assetClass: item?.assetClass ?? ("azione" as AssetClass),
    descrizione: item?.descrizione ?? "",
    targetPrice: item?.targetPrice ?? "",
    rating: item?.rating ?? ("" as "" | WatchlistRating),
    peRatio: item?.peRatio ?? "",
    dividendYield: item?.dividendYield ?? "",
    metricheExtra: Object.entries(item?.metricheExtra ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
    analisiTesto: item?.analisiTesto ?? "",
  });
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  function aggiorna(campo: string, valore: string | number) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function aggiungiMetrica() {
    setForm((prev) => ({
      ...prev,
      metricheExtra: [...prev.metricheExtra, { key: "", value: "" }],
    }));
  }

  function aggiornaMetrica(index: number, campo: "key" | "value", valore: string) {
    setForm((prev) => {
      const metriche = [...prev.metricheExtra];
      metriche[index] = { ...metriche[index], [campo]: valore };
      return { ...prev, metricheExtra: metriche };
    });
  }

  function rimuoviMetrica(index: number) {
    setForm((prev) => ({
      ...prev,
      metricheExtra: prev.metricheExtra.filter((_, i) => i !== index),
    }));
  }

  async function invio(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    setCaricamento(true);

    try {
      const metricheObj: Record<string, string | number> = {};
      for (const m of form.metricheExtra) {
        if (m.key.trim()) {
          const numVal = Number(m.value);
          metricheObj[m.key.trim()] = isNaN(numVal) || m.value.trim() === "" ? m.value : numVal;
        }
      }

      const payload = {
        ticker: form.ticker.trim().toUpperCase(),
        tickerYahoo: form.tickerYahoo.trim() || null,
        nome: form.nome.trim(),
        settore: form.settore,
        paese: form.paese,
        assetClass: form.assetClass,
        descrizione: form.descrizione.trim(),
        targetPrice: form.targetPrice !== "" ? Number(form.targetPrice) : null,
        rating: form.rating || null,
        peRatio: form.peRatio !== "" ? Number(form.peRatio) : null,
        dividendYield: form.dividendYield !== "" ? Number(form.dividendYield) : null,
        metricheExtra: metricheObj,
        analisiTesto: form.analisiTesto.trim() || null,
      };

      const url = isModifica
        ? `/api/admin/watchlist/${item.id}`
        : "/api/admin/watchlist";
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

      router.push("/admin/watchlist");
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
          <label className={labelClass}>Ticker Yahoo Finance (opzionale)</label>
          <input
            type="text"
            value={form.tickerYahoo}
            onChange={(e) => aggiorna("tickerYahoo", e.target.value)}
            className={inputClass}
            placeholder="Es. SPM.MI, BTC-USD, CL=F"
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
          <label className={labelClass}>Rating (opzionale)</label>
          <select
            value={form.rating}
            onChange={(e) => aggiorna("rating", e.target.value)}
            className={inputClass}
          >
            {RATINGS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Target Price ($) (opzionale)</label>
          <input
            type="number"
            step="0.01"
            value={form.targetPrice}
            onChange={(e) => aggiorna("targetPrice", e.target.value)}
            className={inputClass}
            placeholder="Es. 150.00"
          />
        </div>

        <div>
          <label className={labelClass}>P/E Ratio (opzionale)</label>
          <input
            type="number"
            step="0.01"
            value={form.peRatio}
            onChange={(e) => aggiorna("peRatio", e.target.value)}
            className={inputClass}
            placeholder="Es. 25.5"
          />
        </div>

        <div>
          <label className={labelClass}>Dividend Yield % (opzionale)</label>
          <input
            type="number"
            step="0.01"
            value={form.dividendYield}
            onChange={(e) => aggiorna("dividendYield", e.target.value)}
            className={inputClass}
            placeholder="Es. 2.5"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClass}>Descrizione</label>
        <textarea
          value={form.descrizione}
          onChange={(e) => aggiorna("descrizione", e.target.value)}
          required
          rows={7}
          className={inputClass}
          placeholder="Descrizione del titolo e motivo di interesse..."
        />
      </div>

      <div className="mt-4">
        <label className={labelClass}>Analisi (opzionale)</label>
        <textarea
          value={form.analisiTesto}
          onChange={(e) => aggiorna("analisiTesto", e.target.value)}
          rows={10}
          className={inputClass}
          placeholder="Analisi approfondita del titolo..."
        />
      </div>

      {/* Metriche Extra */}
      <div className="mt-4">
        <label className={labelClass}>Metriche Extra (opzionale)</label>
        <div className="space-y-2">
          {form.metricheExtra.map((metrica, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={metrica.key}
                onChange={(e) => aggiornaMetrica(index, "key", e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="Nome metrica"
              />
              <input
                type="text"
                value={metrica.value}
                onChange={(e) => aggiornaMetrica(index, "value", e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="Valore"
              />
              <button
                type="button"
                onClick={() => rimuoviMetrica(index)}
                className="px-3 py-2 text-sm text-rosso-perdita bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
              >
                Rimuovi
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={aggiungiMetrica}
          className="mt-2 px-4 py-2 text-sm font-medium text-verde-scuro bg-verde-primario/10 rounded-lg hover:bg-verde-primario/20 transition-colors cursor-pointer"
        >
          Aggiungi metrica
        </button>
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
          {caricamento ? "Salvataggio..." : isModifica ? "Salva Modifiche" : "Aggiungi alla Watchlist"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/watchlist")}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}
