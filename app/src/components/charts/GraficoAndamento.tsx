"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PuntoStorico } from "@/types/portafoglio";
import { formatData, formatValuta } from "@/lib/format";

interface Props {
  storico: PuntoStorico[];
}

export default function GraficoAndamento({ storico }: Props) {
  const dati = storico.map((p) => ({
    ...p,
    dataLabel: formatData(p.data),
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-nero mb-4">Andamento Portafoglio</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dati} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorValore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="dataLabel" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              domain={["dataMin - 500", "dataMax + 500"]}
            />
            <Tooltip
              formatter={(value) => [formatValuta(Number(value)), "Valore"]}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="valore"
              stroke="#4CAF50"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValore)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
