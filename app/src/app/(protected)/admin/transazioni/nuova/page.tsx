"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FormTransazione from "@/components/admin/FormTransazione";
import type { PortfolioId } from "@/types/portafoglio";

interface CategoriaOption {
  id: string;
  nome: string;
}

export default function NuovaTransazione() {
  const searchParams = useSearchParams();
  const portfolio = (searchParams.get("portfolio") || "basic") as PortfolioId;
  const [categorie, setCategorie] = useState<CategoriaOption[]>([]);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/categorie?portfolio=${portfolio}`)
      .then((res) => res.json())
      .then((data) => {
        setCategorie(
          Array.isArray(data) ? data.map((c: CategoriaOption) => ({ id: c.id, nome: c.nome })) : []
        );
      })
      .finally(() => setCaricamento(false));
  }, [portfolio]);

  if (caricamento) {
    return <div className="text-center py-12 text-gray-500">Caricamento...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-nero mb-6">
        Nuova Transazione — {"Basic"}
      </h1>
      <FormTransazione
        categorie={categorie}
        portfolioId={portfolio}
      />
    </div>
  );
}
