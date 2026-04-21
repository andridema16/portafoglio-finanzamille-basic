"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FormWatchlistItem from "@/components/admin/FormWatchlistItem";
import type { WatchlistItem } from "@/types/portafoglio";

export default function NuovoWatchlistItem() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const isModifica = !!idParam;

  const [item, setItem] = useState<WatchlistItem | null>(null);
  const [caricamento, setCaricamento] = useState(isModifica);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    if (!idParam) return;

    fetch(`/api/admin/watchlist/${idParam}`)
      .then((res) => {
        if (!res.ok) throw new Error("Elemento non trovato");
        return res.json();
      })
      .then((data) => setItem(data))
      .catch(() => setErrore("Errore nel caricamento"))
      .finally(() => setCaricamento(false));
  }, [idParam]);

  if (caricamento) {
    return <div className="text-center py-12 text-gray-500">Caricamento...</div>;
  }

  if (errore) {
    return <div className="text-center py-12 text-rosso-perdita">{errore}</div>;
  }

  if (isModifica && !item) {
    return <div className="text-center py-12 text-rosso-perdita">Elemento non trovato</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-nero mb-6">
        {isModifica && item ? `Modifica — ${item.ticker}` : "Aggiungi alla Watchlist"}
      </h1>
      <FormWatchlistItem item={item ?? undefined} />
    </div>
  );
}
