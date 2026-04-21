"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Titolo, AssetClass, Paese, Settore, PortfolioId } from "@/types/portafoglio";

type TipoTransazione = "dividendo" | "vendita" | "acquisto";

interface TitoloSintetico {
  ticker: string;
  nome: string;
  numAzioni: number;
  prezzoMedioCarico: number;
  valoreAttuale: number;
  categoria: string;
}

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
  categorie: { id: string; nome: string }[];
  portfolioId?: PortfolioId;
}

export default function FormTransazione({ categorie, portfolioId = "basic" }: Props) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoTransazione>("vendita");
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  // Dati titoli caricati dal DB
  const [titoli, setTitoli] = useState<TitoloSintetico[]>([]);
  const [titoloCorrente, setTitoloCorrente] = useState<TitoloSintetico | null>(null);
  const [tickerNonTrovato, setTickerNonTrovato] = useState(false);

  // Campi form minimi
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    ticker: "",
    // Vendita
    azioniVendute: 0,
    prezzoVendita: 0,
    // Acquisto
    azioniComprate: 0,
    prezzoAcquisto: 0,
    // Dividendo
    importo: 0,
    descrizione: "",
    // Comune
    nota: "",
    // Campi extra per nuovo titolo (acquisto)
    nome: "",
    categoria: categorie[0]?.id ?? "",
    assetClass: "azione" as AssetClass,
    paese: "USA" as Paese,
    settore: "energia" as Settore,
  });

  // Carica lista titoli al mount
  useEffect(() => {
    fetch(`/api/admin/titoli?portfolio=${portfolioId}`)
      .then((r) => r.json())
      .then((data: Titolo[]) => {
        setTitoli(
          data.map((t) => ({
            ticker: t.ticker,
            nome: t.nome,
            numAzioni: t.numAzioni,
            prezzoMedioCarico: t.prezzoMedioCarico,
            valoreAttuale: t.valoreAttuale,
            categoria: t.categoria,
          }))
        );
      })
      .catch(() => {});
  }, [portfolioId]);

  // Cerca titolo quando il ticker cambia
  const cercaTitolo = useCallback(
    (ticker: string) => {
      const upper = ticker.toUpperCase();
      const trovato = titoli.find((t) => t.ticker === upper);
      if (trovato) {
        setTitoloCorrente(trovato);
        setTickerNonTrovato(false);
      } else if (upper.length >= 1) {
        setTitoloCorrente(null);
        setTickerNonTrovato(upper.length >= 2);
      } else {
        setTitoloCorrente(null);
        setTickerNonTrovato(false);
      }
    },
    [titoli]
  );

  function aggiorna(campo: string, valore: string | number) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
    if (campo === "ticker") {
      cercaTitolo(valore as string);
    }
  }

  // Preview calcoli in tempo reale
  type PreviewVendita = { tipo: "vendita"; utile: number; percentuale: number; ricavo: number };
  type PreviewAcquisto = { tipo: "acquisto"; costoTotale: number; nuovoPrezzoMedio: number; nuoveAzioniTotali: number };
  type Preview = PreviewVendita | PreviewAcquisto | null;

  const preview: Preview = (() => {
    if (!titoloCorrente) return null;
    const t = titoloCorrente;

    if (tipo === "vendita" && form.azioniVendute > 0 && form.prezzoVendita > 0) {
      const utile = (form.prezzoVendita - t.prezzoMedioCarico) * form.azioniVendute;
      const perc =
        t.prezzoMedioCarico > 0
          ? ((form.prezzoVendita - t.prezzoMedioCarico) / t.prezzoMedioCarico) * 100
          : 0;
      const ricavo = form.azioniVendute * form.prezzoVendita;
      return { tipo: "vendita" as const, utile, percentuale: perc, ricavo };
    }

    if (tipo === "acquisto" && form.azioniComprate > 0 && form.prezzoAcquisto > 0) {
      const vecchioCosto = t.numAzioni * t.prezzoMedioCarico;
      const costoNuovo = form.azioniComprate * form.prezzoAcquisto;
      const nuoveAzioni = t.numAzioni + form.azioniComprate;
      const nuovoPrezzoMedio =
        nuoveAzioni > 0 ? (vecchioCosto + costoNuovo) / nuoveAzioni : form.prezzoAcquisto;
      return {
        tipo: "acquisto" as const,
        costoTotale: costoNuovo,
        nuovoPrezzoMedio,
        nuoveAzioniTotali: nuoveAzioni,
      };
    }

    return null;
  })();

  async function invio(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    setCaricamento(true);

    try {
      let payload: Record<string, unknown>;

      if (tipo === "vendita") {
        payload = {
          tipo: "vendita",
          data: form.data,
          ticker: form.ticker.toUpperCase(),
          azioniVendute: form.azioniVendute,
          prezzoVendita: form.prezzoVendita,
          nota: form.nota,
        };
      } else if (tipo === "acquisto") {
        payload = {
          tipo: "acquisto",
          data: form.data,
          ticker: form.ticker.toUpperCase(),
          azioniComprate: form.azioniComprate,
          prezzoAcquisto: form.prezzoAcquisto,
          nota: form.nota,
        };
        // Se ticker non trovato, aggiungi campi extra per nuovo titolo
        if (tickerNonTrovato) {
          payload.nome = form.nome;
          payload.categoria = form.categoria;
          payload.assetClass = form.assetClass;
          payload.paese = form.paese;
          payload.settore = form.settore;
        }
      } else {
        payload = {
          tipo: "dividendo",
          data: form.data,
          ticker: form.ticker.toUpperCase(),
          importo: form.importo,
          descrizione: form.descrizione || undefined,
        };
      }

      const res = await fetch("/api/admin/transazioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, portfolioId }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Se l'API segnala che serve un nuovo titolo, mostra i campi extra
        if (data.nuovoTitolo) {
          setTickerNonTrovato(true);
          throw new Error("Ticker nuovo: compila i campi aggiuntivi qui sotto");
        }
        throw new Error(data.error || "Errore nel salvataggio");
      }

      router.push("/admin/transazioni");
      router.refresh();
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setCaricamento(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-primario/50 focus:border-verde-primario";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const selectClass = inputClass;

  // Suggerimenti ticker (autocomplete semplice)
  const tickerUpper = form.ticker.toUpperCase();
  const suggerimenti =
    tickerUpper.length >= 1
      ? titoli
          .filter(
            (t) =>
              t.ticker.startsWith(tickerUpper) || t.nome.toUpperCase().includes(tickerUpper)
          )
          .slice(0, 6)
      : [];

  const [mostraSuggerimenti, setMostraSuggerimenti] = useState(false);

  function selezionaTicker(ticker: string) {
    aggiorna("ticker", ticker);
    setMostraSuggerimenti(false);
    cercaTitolo(ticker);
  }

  return (
    <form onSubmit={invio} className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
      {/* Selettore tipo */}
      <div className="mb-6">
        <label className={labelClass}>Tipo Transazione</label>
        <div className="flex gap-2">
          {(["vendita", "acquisto", "dividendo"] as TipoTransazione[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                tipo === t
                  ? "bg-verde-scuro text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Data */}
        <div>
          <label className={labelClass}>Data</label>
          <input
            type="date"
            value={form.data}
            onChange={(e) => aggiorna("data", e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {/* Ticker con autocomplete */}
        <div className="relative">
          <label className={labelClass}>Ticker</label>
          <input
            type="text"
            value={form.ticker}
            onChange={(e) => {
              aggiorna("ticker", e.target.value.toUpperCase());
              setMostraSuggerimenti(true);
            }}
            onFocus={() => setMostraSuggerimenti(true)}
            onBlur={() => setTimeout(() => setMostraSuggerimenti(false), 200)}
            required
            className={inputClass}
            placeholder="Es. GOOGL"
            autoComplete="off"
          />
          {/* Suggerimenti dropdown */}
          {mostraSuggerimenti && suggerimenti.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {suggerimenti.map((s) => (
                <button
                  key={s.ticker}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selezionaTicker(s.ticker)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex justify-between cursor-pointer"
                >
                  <span>
                    <span className="font-medium">{s.ticker}</span>
                    <span className="text-gray-500 ml-2">{s.nome}</span>
                  </span>
                  <span className="text-gray-400">{s.numAzioni} az.</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info titolo trovato */}
        {titoloCorrente && (
          <div className="md:col-span-2 bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <span className="text-gray-500">Titolo:</span>{" "}
                <span className="font-medium">{titoloCorrente.nome}</span>
              </span>
              <span>
                <span className="text-gray-500">Azioni:</span>{" "}
                <span className="font-medium">{titoloCorrente.numAzioni}</span>
              </span>
              <span>
                <span className="text-gray-500">Prezzo carico:</span>{" "}
                <span className="font-medium">
                  ${titoloCorrente.prezzoMedioCarico.toFixed(2)}
                </span>
              </span>
              <span>
                <span className="text-gray-500">Valore:</span>{" "}
                <span className="font-medium">
                  ${titoloCorrente.valoreAttuale.toFixed(2)}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Ticker non trovato */}
        {tickerNonTrovato && tipo !== "acquisto" && (
          <div className="md:col-span-2 bg-red-50 text-rosso-perdita rounded-lg p-3 text-sm">
            Ticker non presente in portafoglio
          </div>
        )}

        {/* ─── CAMPI VENDITA ─── */}
        {tipo === "vendita" && (
          <>
            <div>
              <label className={labelClass}>
                Azioni da vendere
                {titoloCorrente && (
                  <span className="text-gray-400 font-normal ml-1">
                    (max {titoloCorrente.numAzioni})
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={titoloCorrente?.numAzioni}
                value={form.azioniVendute || ""}
                onChange={(e) => aggiorna("azioniVendute", Number(e.target.value))}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Prezzo vendita per azione ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.prezzoVendita || ""}
                onChange={(e) => aggiorna("prezzoVendita", Number(e.target.value))}
                required
                className={inputClass}
              />
            </div>
          </>
        )}

        {/* ─── CAMPI ACQUISTO ─── */}
        {tipo === "acquisto" && (
          <>
            <div>
              <label className={labelClass}>Azioni da comprare</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.azioniComprate || ""}
                onChange={(e) => aggiorna("azioniComprate", Number(e.target.value))}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Prezzo acquisto per azione ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.prezzoAcquisto || ""}
                onChange={(e) => aggiorna("prezzoAcquisto", Number(e.target.value))}
                required
                className={inputClass}
              />
            </div>
          </>
        )}

        {/* ─── CAMPI DIVIDENDO ─── */}
        {tipo === "dividendo" && (
          <>
            <div>
              <label className={labelClass}>Importo ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.importo || ""}
                onChange={(e) => aggiorna("importo", Number(e.target.value))}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Descrizione <span className="text-gray-400 font-normal">(opzionale)</span>
              </label>
              <input
                type="text"
                value={form.descrizione}
                onChange={(e) => aggiorna("descrizione", e.target.value)}
                className={inputClass}
                placeholder="Auto-generata se vuota"
              />
            </div>
          </>
        )}

        {/* ─── NOTA (vendita e acquisto) ─── */}
        {(tipo === "vendita" || tipo === "acquisto") && (
          <div className="md:col-span-2">
            <label className={labelClass}>
              Nota <span className="text-gray-400 font-normal">(opzionale)</span>
            </label>
            <textarea
              value={form.nota}
              onChange={(e) => aggiorna("nota", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Nota operativa..."
            />
          </div>
        )}

        {/* ─── CAMPI EXTRA NUOVO TITOLO (solo acquisto ticker non trovato) ─── */}
        {tipo === "acquisto" && tickerNonTrovato && (
          <>
            <div className="md:col-span-2 mt-2">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                Nuovo titolo: compila i dettagli aggiuntivi
              </div>
            </div>
            <div>
              <label className={labelClass}>Nome</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => aggiorna("nome", e.target.value)}
                required
                className={inputClass}
                placeholder="Es. Alphabet Inc"
              />
            </div>
            <div>
              <label className={labelClass}>Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) => aggiorna("categoria", e.target.value)}
                required
                className={selectClass}
              >
                {categorie.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Asset Class</label>
              <select
                value={form.assetClass}
                onChange={(e) => aggiorna("assetClass", e.target.value)}
                required
                className={selectClass}
              >
                {ASSET_CLASSES.map((ac) => (
                  <option key={ac} value={ac}>
                    {ac.charAt(0).toUpperCase() + ac.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Paese</label>
              <select
                value={form.paese}
                onChange={(e) => aggiorna("paese", e.target.value)}
                required
                className={selectClass}
              >
                {PAESI.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Settore</label>
              <select
                value={form.settore}
                onChange={(e) => aggiorna("settore", e.target.value)}
                required
                className={selectClass}
              >
                {SETTORI.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* ─── PREVIEW CALCOLI ─── */}
      {preview && preview.tipo === "vendita" && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Anteprima operazione
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Ricavo totale</span>
              <p className="font-medium">${preview.ricavo.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-gray-500">Prezzo carico</span>
              <p className="font-medium">
                ${titoloCorrente?.prezzoMedioCarico.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Utile/Perdita</span>
              <p
                className={`font-medium ${
                  preview.utile >= 0 ? "text-verde-guadagno" : "text-rosso-perdita"
                }`}
              >
                {preview.utile >= 0 ? "+" : ""}${preview.utile.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Percentuale</span>
              <p
                className={`font-medium ${
                  preview.percentuale >= 0
                    ? "text-verde-guadagno"
                    : "text-rosso-perdita"
                }`}
              >
                {preview.percentuale >= 0 ? "+" : ""}
                {preview.percentuale.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {preview && preview.tipo === "acquisto" && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Anteprima operazione
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Costo totale</span>
              <p className="font-medium">${preview.costoTotale.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-gray-500">Nuovo prezzo medio</span>
              <p className="font-medium">${preview.nuovoPrezzoMedio.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-gray-500">Azioni totali dopo</span>
              <p className="font-medium">{preview.nuoveAzioniTotali}</p>
            </div>
          </div>
        </div>
      )}

      {errore && <p className="mt-4 text-sm text-rosso-perdita">{errore}</p>}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={caricamento}
          className="px-6 py-2.5 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          {caricamento ? "Salvataggio..." : "Aggiungi Transazione"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/transazioni")}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}
