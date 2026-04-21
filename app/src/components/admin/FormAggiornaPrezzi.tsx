"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PortfolioId } from "@/types/portafoglio";

interface TitoloPrezzi {
  ticker: string;
  nome: string;
  numAzioni: number;
  prezzoCorrente: number;
  valoreAttuale: number;
  nuovoPrezzo: string;
}

interface Props {
  portfolioId?: PortfolioId;
}

export default function FormAggiornaPrezzi({ portfolioId = "basic" }: Props) {
  const router = useRouter();
  const [titoli, setTitoli] = useState<TitoloPrezzi[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [messaggio, setMessaggio] = useState<{
    tipo: "successo" | "errore";
    testo: string;
  } | null>(null);

  // Carica titoli
  useEffect(() => {
    setCaricamento(true);
    fetch(`/api/admin/titoli?portfolio=${portfolioId}`)
      .then((r) => r.json())
      .then(
        (
          data: Array<{
            ticker: string;
            nome: string;
            numAzioni: number;
            valoreAttuale: number;
          }>
        ) => {
          setTitoli(
            data.map((t) => ({
              ticker: t.ticker,
              nome: t.nome,
              numAzioni: t.numAzioni,
              prezzoCorrente:
                t.numAzioni > 0 ? t.valoreAttuale / t.numAzioni : 0,
              valoreAttuale: t.valoreAttuale,
              nuovoPrezzo: "",
            }))
          );
        }
      )
      .catch(() =>
        setMessaggio({ tipo: "errore", testo: "Errore nel caricamento titoli" })
      )
      .finally(() => setCaricamento(false));
  }, [portfolioId]);

  function aggiornaPrezzoTitolo(ticker: string, prezzo: string) {
    setTitoli((prev) =>
      prev.map((t) => (t.ticker === ticker ? { ...t, nuovoPrezzo: prezzo } : t))
    );
  }

  // Quanti titoli hanno un prezzo nuovo inserito
  const titoliModificati = titoli.filter(
    (t) => t.nuovoPrezzo !== "" && Number(t.nuovoPrezzo) > 0
  );

  async function salva() {
    if (titoliModificati.length === 0) return;

    setSalvando(true);
    setMessaggio(null);

    try {
      const aggiornamenti = titoliModificati.map((t) => ({
        ticker: t.ticker,
        prezzo: Number(t.nuovoPrezzo),
      }));

      const res = await fetch("/api/admin/aggiorna-prezzo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aggiornamenti, portfolioId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore nel salvataggio");
      }

      const erroriMsg =
        data.errori && data.errori.length > 0
          ? ` (${data.errori.length} errori: ${data.errori.map((e: { ticker: string; errore: string }) => `${e.ticker}: ${e.errore}`).join(", ")})`
          : "";

      setMessaggio({
        tipo: data.errori?.length > 0 ? "errore" : "successo",
        testo: `${data.aggiornati} prezzi aggiornati${erroriMsg}`,
      });

      // Pulisci i campi aggiornati con successo e ricarica
      router.refresh();

      // Ricarica i titoli
      const resRicarica = await fetch(`/api/admin/titoli?portfolio=${portfolioId}`);
      const titoliRicaricati = await resRicarica.json();
      setTitoli(
        titoliRicaricati.map(
          (t: {
            ticker: string;
            nome: string;
            numAzioni: number;
            valoreAttuale: number;
          }) => ({
            ticker: t.ticker,
            nome: t.nome,
            numAzioni: t.numAzioni,
            prezzoCorrente:
              t.numAzioni > 0 ? t.valoreAttuale / t.numAzioni : 0,
            valoreAttuale: t.valoreAttuale,
            nuovoPrezzo: "",
          })
        )
      );
    } catch (err) {
      setMessaggio({
        tipo: "errore",
        testo: err instanceof Error ? err.message : "Errore sconosciuto",
      });
    } finally {
      setSalvando(false);
    }
  }

  if (caricamento) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-500 text-sm">Caricamento titoli...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {messaggio && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            messaggio.tipo === "successo"
              ? "bg-green-50 text-verde-guadagno border border-green-200"
              : "bg-red-50 text-rosso-perdita border border-red-200"
          }`}
        >
          {messaggio.testo}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-700">
                Ticker
              </th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">
                Nome
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-700">
                Azioni
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-700">
                Prezzo attuale
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-700">
                Valore
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-700">
                Nuovo prezzo
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-700">
                Nuovo valore
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-700">
                Var.
              </th>
            </tr>
          </thead>
          <tbody>
            {titoli.map((t) => {
              const nuovoPrezzo = Number(t.nuovoPrezzo);
              const haPrezzo = t.nuovoPrezzo !== "" && nuovoPrezzo > 0;
              const nuovoValore = haPrezzo ? t.numAzioni * nuovoPrezzo : null;
              const variazione =
                nuovoValore !== null ? nuovoValore - t.valoreAttuale : null;

              return (
                <tr
                  key={t.ticker}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-2.5 px-2 font-medium">{t.ticker}</td>
                  <td className="py-2.5 px-2 text-gray-600 max-w-[150px] truncate">
                    {t.nome}
                  </td>
                  <td className="py-2.5 px-2 text-right">{t.numAzioni}</td>
                  <td className="py-2.5 px-2 text-right">
                    ${t.prezzoCorrente.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    ${t.valoreAttuale.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={t.nuovoPrezzo}
                      onChange={(e) =>
                        aggiornaPrezzoTitolo(t.ticker, e.target.value)
                      }
                      className="w-24 px-2 py-1 text-right border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-verde-primario/50"
                      placeholder="—"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {nuovoValore !== null ? (
                      <span className="font-medium">
                        ${nuovoValore.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {variazione !== null ? (
                      <span
                        className={`font-medium ${
                          variazione >= 0
                            ? "text-verde-guadagno"
                            : "text-rosso-perdita"
                        }`}
                      >
                        {variazione >= 0 ? "+" : ""}${variazione.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {titoliModificati.length > 0
            ? `${titoliModificati.length} prezzo/i da aggiornare`
            : "Inserisci i nuovi prezzi nella colonna a destra"}
        </p>
        <button
          onClick={salva}
          disabled={salvando || titoliModificati.length === 0}
          className="px-6 py-2.5 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          {salvando
            ? "Aggiornamento..."
            : `Aggiorna ${titoliModificati.length} prezzo/i`}
        </button>
      </div>
    </div>
  );
}
