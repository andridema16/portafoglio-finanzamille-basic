"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DatoSettore {
  nome: string;
  valore: number;
}

interface Props {
  dati: DatoSettore[];
}

const COLORE = "#2d4a3e";

export default function GraficoSettore({ dati }: Props) {
  const datiOrdinati = [...dati].sort((a, b) => b.valore - a.valore);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-nero mb-4">Esposizione per Settore</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={datiOrdinati}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={95} />
            <Tooltip formatter={(value) => [`$${Number(value).toLocaleString("en-US")}`, "Valore"]} />
            <Bar dataKey="valore" fill={COLORE} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
