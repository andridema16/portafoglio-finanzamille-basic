import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
  validation: { logErrors: false },
});

// --------------- Cache in-memory (prezzi) ---------------

interface CacheEntry {
  prezzi: Record<string, number | null>;
  timestamp: number;
}

const TTL_MS = 3 * 60 * 1000; // 3 minuti
let cache: CacheEntry | null = null;

function cacheValida(): boolean {
  return cache !== null && Date.now() - cache.timestamp < TTL_MS;
}

// --------------- Cache in-memory (storico SPY) ---------------

interface SpyCacheEntry {
  dati: { data: string; valore: number }[];
  dataInizio: string;
  timestamp: number;
}

const SPY_TTL_MS = 30 * 60 * 1000; // 30 minuti
let spyCache: SpyCacheEntry | null = null;

/**
 * Ritorna lo storico giornaliero dello SPY (S&P 500 ETF) dal dataInizio a oggi.
 * Cache in-memory con TTL di 30 minuti.
 */
export async function getStoricoSPY(
  dataInizio: string
): Promise<{ data: string; valore: number }[]> {
  if (spyCache && spyCache.dataInizio === dataInizio && Date.now() - spyCache.timestamp < SPY_TTL_MS) {
    return spyCache.dati;
  }

  const oggi = new Date().toISOString().slice(0, 10);
  const result = await yahooFinance.chart("SPY", {
    period1: dataInizio,
    period2: oggi,
    interval: "1d",
  });

  const dati = (result.quotes ?? [])
    .filter((q) => q.close != null)
    .map((q) => ({
      data: q.date.toISOString().slice(0, 10),
      valore: q.close!,
    }));

  spyCache = { dati, dataInizio, timestamp: Date.now() };
  return dati;
}

// --------------- Fetch prezzi ---------------

const BATCH_SIZE = 10;

export interface PrezzoDettaglio {
  prezzo: number | null;
  previousClose: number | null;
}

/**
 * Fetcha i prezzi live da Yahoo Finance per una lista di ticker.
 * Li richiede in batch da 10 per evitare timeout/rate-limit.
 * Ritorna un Record dove la chiave è il ticker e il valore è il prezzo (o null se fallisce).
 */
async function fetchPrezziBatch(tickers: string[]): Promise<Record<string, number | null>> {
  const risultato: Record<string, number | null> = {};

  // Dividi in batch
  const batches: string[][] = [];
  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    batches.push(tickers.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    try {
      const quotes = await yahooFinance.quote(batch, { return: "object" });
      for (const ticker of batch) {
        const q = quotes[ticker];
        risultato[ticker] = q?.regularMarketPrice ?? null;
      }
    } catch {
      // Se il batch fallisce, segna tutti come null
      for (const ticker of batch) {
        risultato[ticker] = null;
      }
    }
  }

  return risultato;
}

// --------------- Cache in-memory (prezzi con previous close) ---------------

interface CacheDettaglioEntry {
  prezzi: Record<string, PrezzoDettaglio>;
  timestamp: number;
}

const DETTAGLIO_TTL_MS = 60 * 1000; // 1 minuto (per variazione giornaliera real-time)
let cacheDettaglio: CacheDettaglioEntry | null = null;

function cacheDettaglioValida(): boolean {
  return cacheDettaglio !== null && Date.now() - cacheDettaglio.timestamp < DETTAGLIO_TTL_MS;
}

/**
 * Fetcha prezzi live + previous close da Yahoo Finance per una lista di ticker.
 * I batch vengono eseguiti in parallelo per ridurre la latenza.
 */
async function fetchPrezziDettaglioBatch(
  tickers: string[]
): Promise<Record<string, PrezzoDettaglio>> {
  const batches: string[][] = [];
  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    batches.push(tickers.slice(i, i + BATCH_SIZE));
  }

  const risultati = await Promise.all(
    batches.map(async (batch) => {
      const partial: Record<string, PrezzoDettaglio> = {};
      try {
        const quotes = await yahooFinance.quote(batch, { return: "object" });
        for (const ticker of batch) {
          const q = quotes[ticker];
          partial[ticker] = {
            prezzo: q?.regularMarketPrice ?? null,
            previousClose: q?.regularMarketPreviousClose ?? null,
          };
        }
      } catch {
        for (const ticker of batch) {
          partial[ticker] = { prezzo: null, previousClose: null };
        }
      }
      return partial;
    })
  );

  return Object.assign({}, ...risultati);
}

/**
 * Ritorna prezzi live + previous close per ogni ticker.
 * Cache in-memory con TTL di 1 minuto.
 */
export async function getPrezziConPreviousClose(
  tickers: string[]
): Promise<{ prezzi: Record<string, PrezzoDettaglio>; timestamp: number }> {
  if (cacheDettaglioValida()) {
    const tuttiPresenti = tickers.every((t) => t in cacheDettaglio!.prezzi);
    if (tuttiPresenti) {
      return { prezzi: cacheDettaglio!.prezzi, timestamp: cacheDettaglio!.timestamp };
    }
  }

  const prezzi = await fetchPrezziDettaglioBatch(tickers);
  const timestamp = Date.now();
  cacheDettaglio = { prezzi, timestamp };

  return { prezzi, timestamp };
}

/**
 * Ritorna i prezzi live per una lista di ticker.
 * Usa cache in-memory con TTL di 3 minuti.
 */
export async function getPrezziMultipli(
  tickers: string[]
): Promise<{ prezzi: Record<string, number | null>; timestamp: number }> {
  // Se cache valida e contiene tutti i ticker richiesti, ritorna dalla cache
  if (cacheValida()) {
    const tuttiPresenti = tickers.every((t) => t in cache!.prezzi);
    if (tuttiPresenti) {
      return { prezzi: cache!.prezzi, timestamp: cache!.timestamp };
    }
  }

  const prezzi = await fetchPrezziBatch(tickers);
  const timestamp = Date.now();
  cache = { prezzi, timestamp };

  return { prezzi, timestamp };
}

// --------------- Cache in-memory (prezzi inizio anno) ---------------

interface CacheInizioAnnoEntry {
  prezzi: Record<string, number | null>;
  anno: number;
  timestamp: number;
}

const INIZIO_ANNO_TTL_MS = 24 * 60 * 60 * 1000; // 24 ore (prezzi storici non cambiano)
let cacheInizioAnno: CacheInizioAnnoEntry | null = null;

/**
 * Ritorna il prezzo di chiusura del primo giorno di trading dell'anno corrente
 * per una lista di ticker. Usa Yahoo Finance chart() con intervallo 1-6 gennaio
 * per catturare il primo giorno di borsa aperta (considerando festività e weekend).
 * Cache in-memory con TTL di 24 ore; si invalida automaticamente al cambio d'anno.
 */
export async function getPrezziInizioAnno(
  tickers: string[]
): Promise<Record<string, number | null>> {
  const annoCorrente = new Date().getFullYear();

  const cacheValida =
    cacheInizioAnno !== null &&
    cacheInizioAnno.anno === annoCorrente &&
    Date.now() - cacheInizioAnno.timestamp < INIZIO_ANNO_TTL_MS;

  // Se cache valida e contiene tutti i ticker richiesti, ritorna dalla cache
  if (cacheValida) {
    const tuttiPresenti = tickers.every((t) => t in cacheInizioAnno!.prezzi);
    if (tuttiPresenti) {
      return cacheInizioAnno!.prezzi;
    }
  }

  // Identifica solo i ticker mancanti dalla cache
  const tickerDaFetchare = cacheValida
    ? tickers.filter((t) => !(t in cacheInizioAnno!.prezzi))
    : tickers;

  const period1 = `${annoCorrente}-01-01`;
  const period2 = `${annoCorrente}-01-10`;

  // Dividi in batch da BATCH_SIZE e processa in parallelo
  const batches: string[][] = [];
  for (let i = 0; i < tickerDaFetchare.length; i += BATCH_SIZE) {
    batches.push(tickerDaFetchare.slice(i, i + BATCH_SIZE));
  }

  const risultati = await Promise.all(
    batches.map(async (batch) => {
      const partial: Record<string, number | null> = {};
      const risultatiBatch = await Promise.all(
        batch.map(async (ticker) => {
          try {
            const result = await yahooFinance.chart(ticker, {
              period1,
              period2,
              interval: "1d",
            });
            const quotes = result.quotes ?? [];
            const primaQuota = quotes.find((q) => q.close != null);
            return { ticker, prezzo: primaQuota?.close ?? null };
          } catch {
            return { ticker, prezzo: null as number | null };
          }
        })
      );
      for (const { ticker, prezzo } of risultatiBatch) {
        partial[ticker] = prezzo;
      }
      return partial;
    })
  );

  const nuoviPrezzi: Record<string, number | null> = Object.assign({}, ...risultati);

  // Merge con cache esistente (preserva prezzi già cached)
  const prezziMerge = cacheValida
    ? { ...cacheInizioAnno!.prezzi, ...nuoviPrezzi }
    : nuoviPrezzi;

  cacheInizioAnno = { prezzi: prezziMerge, anno: annoCorrente, timestamp: Date.now() };

  return cacheInizioAnno.prezzi;
}
