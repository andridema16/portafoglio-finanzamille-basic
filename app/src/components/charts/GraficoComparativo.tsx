"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import type { PuntoStorico } from "@/types/portafoglio";

interface Props {
  storicoPortafoglio: PuntoStorico[];
  storicoSPY: PuntoStorico[];
}

const MESI_IT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

function normalizza(serie: PuntoStorico[]): Map<string, number> {
  const mappa = new Map<string, number>();
  if (serie.length === 0) return mappa;
  const primo = serie[0].valore;
  if (primo === 0) return mappa;
  for (const p of serie) {
    mappa.set(p.data, ((p.valore - primo) / primo) * 100);
  }
  return mappa;
}

function formatDataGiornoMese(data: string): string {
  const [, mese, giorno] = data.split("-");
  return `${giorno}/${mese}`;
}

function formatDataMese(data: string): string {
  const [, meseStr] = data.split("-");
  const meseIdx = parseInt(meseStr, 10) - 1;
  return MESI_IT[meseIdx];
}

function filtraRange(serie: PuntoStorico[], dataMin: string, dataMax?: string): PuntoStorico[] {
  return serie.filter((p) => p.data >= dataMin && (dataMax == null || p.data <= dataMax));
}

export default function GraficoComparativo({ storicoPortafoglio, storicoSPY }: Props) {
  const [vista, setVista] = useState<"2026" | "2025">("2026");

  const portFiltrato = vista === "2025"
    ? filtraRange(storicoPortafoglio, "2024-12-31", "2025-12-31")
    : filtraRange(storicoPortafoglio, "2026-01-01");
  const spyFiltrato = vista === "2025"
    ? filtraRange(storicoSPY, "2024-12-31", "2025-12-31")
    : filtraRange(storicoSPY, "2026-01-01");

  const portNorm = normalizza(portFiltrato);
  const spyNorm = normalizza(spyFiltrato);

  // Unisci tutte le date e ordina
  const dateSet = new Set<string>();
  for (const d of portNorm.keys()) dateSet.add(d);
  for (const d of spyNorm.keys()) dateSet.add(d);
  const dateOrdinate = Array.from(dateSet).sort();

  const formatDataLabel = vista === "2026" ? formatDataGiornoMese : formatDataMese;

  const dati = dateOrdinate.map((data) => ({
    data,
    dataLabel: formatDataLabel(data),
    portafoglio: portNorm.get(data) ?? null,
    spy: spyNorm.get(data) ?? null,
  }));

  const titolo = vista === "2025"
    ? "Portafoglio vs S&P 500 — Anno 2025"
    : "Portafoglio vs S&P 500 — Anno 2026";

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-nero mb-4">{titolo}</h3>
      <div className="flex gap-2 text-sm font-medium mb-4">
        <button
          onClick={() => setVista("2026")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            vista === "2026"
              ? "bg-verde-scuro text-white"
              : "bg-[#f3f4f6] text-gray-600"
          }`}
        >
          2026
        </button>
        <button
          onClick={() => setVista("2025")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            vista === "2025"
              ? "bg-verde-scuro text-white"
              : "bg-[#f3f4f6] text-gray-600"
          }`}
        >
          2025
        </button>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dati} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="dataLabel"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
            />
            <Tooltip
              formatter={(value, name) => {
                const v = Number(value);
                return [
                  `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`,
                  name === "portafoglio" ? "Portafoglio" : "S&P 500",
                ];
              }}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend
              formatter={(value) =>
                value === "portafoglio" ? "Portafoglio" : "S&P 500"
              }
            />
            <Line
              type="monotone"
              dataKey="portafoglio"
              stroke="#4CAF50"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="spy"
              stroke="#6b7280"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
