import { getWatchlist } from "@/lib/db";
import { getPrezziMultipli, getPrezziInizioAnno } from "@/lib/yahoo";
import WatchlistGrid from "@/components/WatchlistGrid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Watchlist | FinanzaMille" };

export default async function WatchlistPage() {
  const items = await getWatchlist();

  // Mappa ticker display → ticker Yahoo Finance per il fetch
  const yahooMap = new Map<string, string>();
  for (const item of items) {
    yahooMap.set(item.ticker, item.tickerYahoo ?? item.ticker);
  }
  const tickersYahoo = [...new Set(yahooMap.values())];

  const [{ prezzi, timestamp }, prezziInizio] = await Promise.all([
    getPrezziMultipli(tickersYahoo),
    getPrezziInizioAnno(tickersYahoo),
  ]);

  const prezziData: Record<string, { prezzoAttuale: number | null; ytdPercentuale: number | null }> = {};
  for (const item of items) {
    const yTicker = yahooMap.get(item.ticker)!;
    const attuale = prezzi[yTicker] ?? null;
    const inizio = prezziInizio[yTicker] ?? null;
    prezziData[item.ticker] = {
      prezzoAttuale: attuale,
      ytdPercentuale:
        attuale != null && inizio != null && inizio !== 0
          ? ((attuale - inizio) / inizio) * 100
          : null,
    };
  }

  return (
    <WatchlistGrid
      items={items}
      prezziData={prezziData}
      prezziTimestamp={timestamp}
    />
  );
}
