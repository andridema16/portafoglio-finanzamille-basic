"use client";

import { useState } from "react";
import FormAggiornaPrezzi from "@/components/admin/FormAggiornaPrezzi";
import type { PortfolioId } from "@/types/portafoglio";

export default function AggiornaPrezzi() {
  const [portfolio, setPortfolio] = useState<PortfolioId>("basic");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-nero">Aggiorna Prezzi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Inserisci i nuovi prezzi per azione. Il sistema ricalcola
          automaticamente valori, P&amp;L, pesi e riepilogo portafoglio.
        </p>
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

      <FormAggiornaPrezzi portfolioId={portfolio} />
    </div>
  );
}
