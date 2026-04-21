"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import FormTitolo from "@/components/admin/FormTitolo";
import type { Titolo, PortfolioId } from "@/types/portafoglio";

interface CategoriaOption {
  id: string;
  nome: string;
}

export default function ModificaTitolo({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);
  const searchParams = useSearchParams();
  const portfolio = (searchParams.get("portfolio") || "basic") as PortfolioId;
  const [titolo, setTitolo] = useState<Titolo | null>(null);
  const [categorie, setCategorie] = useState<CategoriaOption[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    const q = `?portfolio=${portfolio}`;
    Promise.all([
      fetch(`/api/admin/titoli/${ticker}${q}`).then((r) => {
        if (!r.ok) throw new Error("Titolo non trovato");
        return r.json();
      }),
      fetch(`/api/admin/categorie${q}`).then((r) => r.json()),
    ])
      .then(([found, cats]) => {
        setTitolo(found);
        setCategorie(
          Array.isArray(cats) ? cats.map((c: CategoriaOption) => ({ id: c.id, nome: c.nome })) : []
        );
      })
      .catch(() => setErrore("Errore nel caricamento"))
      .finally(() => setCaricamento(false));
  }, [ticker, portfolio]);

  if (caricamento) {
    return <div className="text-center py-12 text-gray-500">Caricamento...</div>;
  }

  if (errore || !titolo) {
    return <div className="text-center py-12 text-rosso-perdita">{errore || "Titolo non trovato"}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-nero mb-6">
        Modifica {titolo.ticker} — {titolo.nome}
      </h1>
      <FormTitolo titolo={titolo} categorie={categorie} portfolioId={portfolio} />
    </div>
  );
}
