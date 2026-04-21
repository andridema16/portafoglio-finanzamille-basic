"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DatoGrafico {
  nome: string;
  valore: number;
}

interface Props {
  titolo: string;
  dati: DatoGrafico[];
  colori: string[];
  valuta?: string;
}

export default function GraficoEsposizione({ titolo, dati, colori, valuta = "USD" }: Props) {
  const totale = dati.reduce((acc, d) => acc + d.valore, 0);
  const simbolo = valuta === "EUR" ? "\u20ac" : "$";

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-nero mb-4">{titolo}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dati}
              dataKey="valore"
              nameKey="nome"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
              label={({ percent }) => {
                return `${((percent ?? 0) * 100).toFixed(1)}%`;
              }}
              labelLine={{ strokeWidth: 1 }}
            >
              {dati.map((_, i) => (
                <Cell key={i} fill={colori[i % colori.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const v = Number(value);
                const pct = ((v / totale) * 100).toFixed(1);
                return [`${simbolo}${v.toLocaleString("en-US")} (${pct}%)`, "Valore"];
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
