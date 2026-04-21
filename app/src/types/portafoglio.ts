export type UserRole = "user" | "admin";

export type PortfolioId = "basic";

export interface Portafoglio {
  portfolioId: PortfolioId;
  investimentoIniziale: number;
  valoreAttuale: number;
  utileRealizzato: number;
  profittoOPerdita: number;
  varPercentuale: number;
  liquidita: number;
  notaLiquidita: string;
  valuta: string;
  dataInizio: string;
  dataAggiornamento: string;
}

export interface Categoria {
  portfolioId: PortfolioId;
  id: string;
  nome: string;
  slug: string;
  pesoPercentuale: number;
  costo: number;
  valoreAttuale: number;
  profittoOPerdita: number;
  plPercentuale: number;
  dividendi: number;
}

export type AssetClass = "azione" | "etf" | "obbligazione" | "crypto" | "metallo";

export type Paese =
  | "USA"
  | "Canada"
  | "UK"
  | "Francia"
  | "Svizzera"
  | "India"
  | "Brasile"
  | "Messico"
  | "Colombia"
  | "Panama"
  | "Europa"
  | "Asia-Pacifico"
  | "Sud-Est Asiatico"
  | "Mercati Emergenti"
  | "America Latina"
  | "Globale";

export type Settore =
  | "energia"
  | "risorse-naturali"
  | "tecnologia"
  | "finanza"
  | "sanita"
  | "consumer"
  | "trasporti"
  | "utilities"
  | "metalli-preziosi"
  | "crypto"
  | "obbligazionario"
  | "small-cap"
  | "diversificato";

export interface Titolo {
  portfolioId: PortfolioId;
  ticker: string;
  nome: string;
  categoria: string;
  numAzioni: number;
  prezzoMedioCarico: number;
  costo: number;
  valoreAttuale: number;
  pesoPercentuale: number;
  varPrezzo: number;
  dividendi: number;
  profittoOPerdita: number;
  plPercentuale: number;
  peRatio: number | null;
  isin: string | null;
  assetClass: AssetClass;
  paese: Paese;
  settore: Settore;
}

export interface Dividendo {
  data: string;
  tipo: "dividendo";
  descrizione: string;
  ticker: string;
  importo: number;
}

export interface OperazioneVendita {
  data: string;
  tipo: "vendita";
  ticker: string;
  nome: string;
  azioniVendute: number;
  prezzoAcquisto: number;
  prezzoVendita: number;
  utileRealizzato: number;
  percentuale: number;
  nota: string;
}

export interface OperazioneAcquisto {
  data: string;
  tipo: "acquisto";
  ticker: string;
  nome: string;
  azioniComprate: number;
  prezzoAcquisto: number;
  nota: string;
}

export type Operazione = OperazioneVendita | OperazioneAcquisto;

export type Transazione = Dividendo | Operazione;

export interface PuntoStorico {
  data: string;
  valore: number;
}

export interface FlussoCapitale {
  id: number;
  data: string;
  tipo: "deposito" | "prelievo" | "inizio";
  importo: number;
  valorePre: number;
  capitalePost: number;
  nota: string;
}

// -- Watchlist --

export type WatchlistRating = "buy" | "hold" | "sell";

export interface WatchlistItem {
  id: number;
  ticker: string;
  tickerYahoo: string | null;
  nome: string;
  settore: Settore;
  paese: Paese;
  assetClass: AssetClass;
  descrizione: string;
  targetPrice: number | null;
  rating: WatchlistRating | null;
  peRatio: number | null;
  dividendYield: number | null;
  metricheExtra: Record<string, string | number>;
  analisiTesto: string | null;
  dataInserimento: string;
  dataAggiornamento: string;
}
