"use client";

import GraficoComparativo from "@/components/charts/GraficoComparativo";
import GraficoEsposizione from "@/components/charts/GraficoEsposizione";
import type { PuntoStorico, PortfolioId } from "@/types/portafoglio";

interface CategoriaChart {
  nome: string;
  valoreAttuale: number;
}

interface Props {
  portfolioId: PortfolioId;
  storicoPortafoglio: PuntoStorico[];
  storicoSPY: PuntoStorico[];
  categorie?: CategoriaChart[];
  valuta?: string;
}

const COLORI_CATEGORIE_BASIC = ["#4CAF50", "#FFB300", "#1976D2"];

export default function DashboardCharts({
  portfolioId,
  storicoPortafoglio,
  storicoSPY,
  categorie = [],
  valuta = "USD",
}: Props) {
  if (portfolioId === "basic") {
    const datiDonut = categorie.map((c) => ({
      nome: c.nome,
      valore: c.valoreAttuale,
    }));

    return (
      <div className="space-y-6">
        <GraficoEsposizione
          titolo="Composizione Portafoglio"
          dati={datiDonut}
          colori={COLORI_CATEGORIE_BASIC}
          valuta={valuta}
        />
      </div>
    );
  }

  return (
    <GraficoComparativo
      storicoPortafoglio={storicoPortafoglio}
      storicoSPY={storicoSPY}
    />
  );
}
