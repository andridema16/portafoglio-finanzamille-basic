import { notFound } from "next/navigation";
import { getFlussiCapitale } from "@/lib/db";
import { formatValuta } from "@/lib/format";
import type { FlussoCapitale, PortfolioId } from "@/types/portafoglio";
import { isValidPortfolioId, getPortfolioMeta } from "@/lib/portfolio";

const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function formatMeseAnno(data: string): string {
  const [anno, mese] = data.split("-");
  return `${MESI[parseInt(mese, 10) - 1]} ${anno}`;
}

function badgeTipo(tipo: FlussoCapitale["tipo"]) {
  switch (tipo) {
    case "inizio":
      return { label: "Avvio portafoglio", className: "bg-gray-100 text-gray-700" };
    case "deposito":
      return { label: "Deposito", className: "bg-green-100 text-verde-guadagno" };
    case "prelievo":
      return { label: "Prelievo", className: "bg-red-100 text-rosso-perdita" };
  }
}

export default async function RibilanciamentiPage({
  params,
}: {
  params: Promise<{ portfolio: string }>;
}) {
  const { portfolio } = await params;

  if (!isValidPortfolioId(portfolio)) {
    notFound();
  }

  const portfolioId = portfolio as PortfolioId;
  const meta = getPortfolioMeta(portfolioId);
  const valuta = meta.valuta;

  const flussi = await getFlussiCapitale(portfolioId);

  function formatImporto(flusso: FlussoCapitale): { testo: string; colore: string } | null {
    if (flusso.tipo === "inizio") return null;
    if (flusso.tipo === "deposito") {
      return { testo: `+${formatValuta(flusso.importo, valuta)}`, colore: "text-verde-guadagno" };
    }
    return { testo: `-${formatValuta(flusso.importo, valuta)}`, colore: "text-rosso-perdita" };
  }

  // Raggruppa per anno
  const perAnno = new Map<number, FlussoCapitale[]>();
  for (const f of flussi) {
    const anno = parseInt(f.data.split("-")[0], 10);
    const lista = perAnno.get(anno) ?? [];
    lista.push(f);
    perAnno.set(anno, lista);
  }
  const anniOrdinati = Array.from(perAnno.keys()).sort((a, b) => a - b);

  // Riepilogo
  const totaleDepositato = flussi
    .filter((f) => f.tipo === "deposito")
    .reduce((s, f) => s + f.importo, 0);
  const totalePrelevato = flussi
    .filter((f) => f.tipo === "prelievo")
    .reduce((s, f) => s + f.importo, 0);
  const capitaleAttuale = flussi.length > 0 ? flussi[flussi.length - 1].capitalePost : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-nero">Ribilanciamenti e Movimenti</h1>
        <p className="text-gray-500 mt-1">
          Storico di tutti i depositi, prelievi e variazioni di capitale del portafoglio
        </p>
      </div>

      {anniOrdinati.map((anno) => {
        const lista = perAnno.get(anno)!;
        return (
          <section key={anno} className="mb-10">
            <h3 className="text-lg font-semibold text-nero mb-4">Anno {anno}</h3>
            <div className="space-y-3">
              {lista.map((flusso) => {
                const badge = badgeTipo(flusso.tipo);
                const importo = formatImporto(flusso);
                return (
                  <div
                    key={flusso.id}
                    className="bg-white rounded-xl shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-x-6 sm:gap-y-1"
                  >
                    {/* Data */}
                    <div className="sm:w-40 shrink-0 text-sm font-medium text-gray-500">
                      {formatMeseAnno(flusso.data)}
                    </div>

                    {/* Descrizione + importo */}
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      {importo && (
                        <span className={`text-sm font-semibold ${importo.colore}`}>
                          {importo.testo}
                        </span>
                      )}
                    </div>

                    {/* Capitale dopo */}
                    <div className="sm:text-right shrink-0">
                      <span className="text-xs text-gray-400">Capitale dopo</span>
                      <p className="text-sm font-semibold text-nero">
                        {formatValuta(flusso.capitalePost, valuta)}
                      </p>
                    </div>

                    {/* Nota (riga intera sotto) */}
                    {flusso.nota && (
                      <p className="w-full text-xs text-gray-400 mt-1 sm:mt-0 sm:basis-full">
                        {flusso.nota}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Riepilogo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-1">Totale depositato</p>
          <p className="text-lg font-bold text-verde-guadagno">
            {formatValuta(totaleDepositato, valuta)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-1">Totale prelevato</p>
          <p className="text-lg font-bold text-rosso-perdita">
            {formatValuta(totalePrelevato, valuta)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-1">Capitale attuale</p>
          <p className="text-lg font-bold text-nero">
            {formatValuta(capitaleAttuale, valuta)}
          </p>
        </div>
      </div>
    </div>
  );
}
