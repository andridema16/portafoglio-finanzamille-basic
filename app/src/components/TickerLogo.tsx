"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  ticker: string;
  nome: string;
  size?: number;
}

const COLORI = [
  "#2d4a3e", "#4CAF50", "#38a169", "#1a73e8", "#e53e3e",
  "#9333ea", "#ea580c", "#0891b2", "#4f46e5", "#b91c1c",
];

function coloreDaTicker(ticker: string): string {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORI[Math.abs(hash) % COLORI.length];
}

export default function TickerLogo({ ticker, nome, size = 28 }: Props) {
  const [errore, setErrore] = useState(false);

  if (errore) {
    return (
      <span
        role="img"
        aria-label={nome}
        className="inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          backgroundColor: coloreDaTicker(ticker),
        }}
      >
        {ticker.charAt(0)}
      </span>
    );
  }

  return (
    <Image
      src={`https://assets.parqet.com/logos/symbol/${ticker}?format=png`}
      alt={nome}
      width={size}
      height={size}
      className="rounded-full shrink-0"
      onError={() => setErrore(true)}
    />
  );
}
