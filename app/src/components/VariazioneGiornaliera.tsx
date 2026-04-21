"use client";

import { useEffect, useState, useCallback } from "react";

interface DatiVariazione {
  variazioneDollari: number;
  variazionePercentuale: number;
  valoreCorrente: number;
  timestamp: number;
}

const INTERVALLO_REFRESH = 60 * 1000; // 60 secondi

function formatOraLocale(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });
}

function formatVariazioneValuta(valore: number, valuta: string = "USD"): string {
  const segno = valore > 0 ? "+" : "";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: valuta,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valore);
  return `${segno}${formatted}`;
}

function formatVariazionePercentuale(valore: number): string {
  const segno = valore > 0 ? "+" : "";
  return `${segno}${valore.toFixed(2)}%`;
}

interface VariazioneProps {
  portfolioId?: string;
  valuta?: string;
}

export default function VariazioneGiornaliera({ portfolioId = "basic", valuta = "USD" }: VariazioneProps) {
  const [dati, setDati] = useState<DatiVariazione | null>(null);
  const [errore, setErrore] = useState(false);
  const [caricamento, setCaricamento] = useState(true);

  const fetchVariazione = useCallback(async () => {
    try {
      const res = await fetch(`/api/variazione-giornaliera?portfolio=${portfolioId}`);
      if (!res.ok) {
        setErrore(true);
        return;
      }
      const json = await res.json();
      setDati(json);
      setErrore(false);
    } catch {
      setErrore(true);
    } finally {
      setCaricamento(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    fetchVariazione();
    const interval = setInterval(fetchVariazione, INTERVALLO_REFRESH);
    return () => clearInterval(interval);
  }, [fetchVariazione]);

  if (caricamento) {
    return (
      <div className="mt-1.5 space-y-1 animate-pulse">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-3 w-36 bg-gray-100 rounded" />
      </div>
    );
  }

  if (errore || !dati) {
    return null;
  }

  const positivo = dati.variazioneDollari >= 0;
  const colore = positivo ? "text-verde-guadagno" : "text-rosso-perdita";

  return (
    <div className="mt-1.5">
      <p className={`text-sm font-semibold ${colore}`}>
        {formatVariazioneValuta(dati.variazioneDollari, valuta)}{" "}
        <span className="font-normal">
          ({formatVariazionePercentuale(dati.variazionePercentuale)})
        </span>
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">
        Ultimo aggiornamento: {formatOraLocale(dati.timestamp)}
      </p>
    </div>
  );
}
