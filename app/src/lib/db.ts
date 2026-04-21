import { cache } from "react";
import { neon } from "@neondatabase/serverless";
import type {
  Portafoglio,
  Categoria,
  Titolo,
  Dividendo,
  OperazioneVendita,
  OperazioneAcquisto,
  Operazione,
  PuntoStorico,
  FlussoCapitale,
  WatchlistItem,
  WatchlistRating,
  AssetClass,
  Paese,
  Settore,
  PortfolioId,
} from "@/types/portafoglio";

function getSQL() {
  return neon(process.env.DATABASE_URL!);
}

// --------------- helpers ---------------

function toDateStr(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function rowToPortafoglio(r: Record<string, unknown>): Portafoglio {
  return {
    portfolioId: (r.portfolio_id as PortfolioId) ?? "basic",
    investimentoIniziale: Number(r.investimento_iniziale),
    valoreAttuale: Number(r.valore_attuale),
    utileRealizzato: Number(r.utile_realizzato),
    profittoOPerdita: Number(r.profitto_o_perdita),
    varPercentuale: Number(r.var_percentuale),
    liquidita: Number(r.liquidita),
    notaLiquidita: r.nota_liquidita as string,
    valuta: r.valuta as string,
    dataInizio: toDateStr(r.data_inizio),
    dataAggiornamento: toDateStr(r.data_aggiornamento),
  };
}

function rowToCategoria(r: Record<string, unknown>): Categoria {
  return {
    portfolioId: (r.portfolio_id as PortfolioId) ?? "basic",
    id: r.id as string,
    nome: r.nome as string,
    slug: r.slug as string,
    pesoPercentuale: Number(r.peso_percentuale),
    costo: Number(r.costo),
    valoreAttuale: Number(r.valore_attuale),
    profittoOPerdita: Number(r.profitto_o_perdita),
    plPercentuale: Number(r.pl_percentuale),
    dividendi: Number(r.dividendi),
  };
}

function rowToTitolo(r: Record<string, unknown>): Titolo {
  return {
    portfolioId: (r.portfolio_id as PortfolioId) ?? "basic",
    ticker: r.ticker as string,
    nome: r.nome as string,
    categoria: r.categoria as string,
    numAzioni: Number(r.num_azioni),
    prezzoMedioCarico: Number(r.prezzo_medio_carico),
    costo: Number(r.costo),
    valoreAttuale: Number(r.valore_attuale),
    pesoPercentuale: Number(r.peso_percentuale),
    varPrezzo: Number(r.var_prezzo),
    dividendi: Number(r.dividendi),
    profittoOPerdita: Number(r.profitto_o_perdita),
    plPercentuale: Number(r.pl_percentuale),
    peRatio: r.pe_ratio != null ? Number(r.pe_ratio) : null,
    isin: (r.isin as string | null) ?? null,
    assetClass: r.asset_class as AssetClass,
    paese: r.paese as Paese,
    settore: r.settore as Settore,
  };
}

function rowToDividendo(r: Record<string, unknown>): Dividendo {
  return {
    data: toDateStr(r.data),
    tipo: "dividendo",
    descrizione: r.descrizione as string,
    ticker: r.ticker as string,
    importo: Number(r.importo),
  };
}

function rowToOperazione(r: Record<string, unknown>): Operazione {
  if (r.tipo === "vendita") {
    return {
      data: toDateStr(r.data),
      tipo: "vendita",
      ticker: r.ticker as string,
      nome: r.nome as string,
      azioniVendute: Number(r.azioni_vendute),
      prezzoAcquisto: Number(r.prezzo_acquisto),
      prezzoVendita: Number(r.prezzo_vendita),
      utileRealizzato: Number(r.utile_realizzato),
      percentuale: Number(r.percentuale),
      nota: (r.nota as string) ?? "",
    } satisfies OperazioneVendita;
  }
  return {
    data: toDateStr(r.data),
    tipo: "acquisto",
    ticker: r.ticker as string,
    nome: r.nome as string,
    azioniComprate: Number(r.azioni_comprate),
    prezzoAcquisto: Number(r.prezzo_acquisto),
    nota: (r.nota as string) ?? "",
  } satisfies OperazioneAcquisto;
}

function rowToStorico(r: Record<string, unknown>): PuntoStorico {
  return {
    data: toDateStr(r.data),
    valore: Number(r.valore),
  };
}

function rowToFlussoCapitale(r: Record<string, unknown>): FlussoCapitale {
  return {
    id: Number(r.id),
    data: toDateStr(r.data),
    tipo: r.tipo as FlussoCapitale["tipo"],
    importo: Number(r.importo),
    valorePre: Number(r.valore_pre),
    capitalePost: Number(r.capitale_post),
    nota: (r.nota as string) ?? "",
  };
}

// --------------- READ ---------------

export async function getPortafoglio(portfolioId: PortfolioId = "basic"): Promise<Portafoglio> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM portafoglio WHERE portfolio_id = ${portfolioId} LIMIT 1`;
  if (rows.length === 0) throw new Error("Portafoglio non trovato");
  return rowToPortafoglio(rows[0]);
}

export const getCategorie = cache(async (portfolioId: PortfolioId = "basic"): Promise<Categoria[]> => {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM categorie WHERE portfolio_id = ${portfolioId} ORDER BY peso_percentuale DESC`;
  return rows.map(rowToCategoria);
});

export async function getCategoriaBySlug(portfolioId: PortfolioId, slug: string): Promise<Categoria | null> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM categorie WHERE portfolio_id = ${portfolioId} AND slug = ${slug} LIMIT 1`;
  return rows.length > 0 ? rowToCategoria(rows[0]) : null;
}

export async function getTitoli(portfolioId: PortfolioId = "basic"): Promise<Titolo[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM titoli WHERE portfolio_id = ${portfolioId} ORDER BY categoria, peso_percentuale DESC`;
  return rows.map(rowToTitolo);
}

export async function getTitoliByCategoria(portfolioId: PortfolioId, categoriaId: string): Promise<Titolo[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM titoli WHERE portfolio_id = ${portfolioId} AND categoria = ${categoriaId} ORDER BY peso_percentuale DESC`;
  return rows.map(rowToTitolo);
}

export async function getStorico(portfolioId: PortfolioId = "basic"): Promise<PuntoStorico[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM storico WHERE portfolio_id = ${portfolioId} ORDER BY data ASC`;
  return rows.map(rowToStorico);
}

export async function getTransazioni(portfolioId: PortfolioId = "basic"): Promise<{ dividendi: Dividendo[]; operazioni: Operazione[] }> {
  const sql = getSQL();
  const [divRows, opRows] = await Promise.all([
    sql`SELECT * FROM dividendi WHERE portfolio_id = ${portfolioId} ORDER BY data DESC`,
    sql`SELECT * FROM operazioni WHERE portfolio_id = ${portfolioId} ORDER BY data ASC`,
  ]);
  return {
    dividendi: divRows.map(rowToDividendo),
    operazioni: opRows.map(rowToOperazione),
  };
}

// --------------- CRUD ADMIN ---------------

// -- Portafoglio --
export async function updatePortafoglio(p: Portafoglio): Promise<void> {
  const sql = getSQL();
  const pid = p.portfolioId ?? "basic";
  await sql`UPDATE portafoglio SET
    investimento_iniziale = ${p.investimentoIniziale},
    valore_attuale = ${p.valoreAttuale},
    utile_realizzato = ${p.utileRealizzato},
    profitto_o_perdita = ${p.profittoOPerdita},
    var_percentuale = ${p.varPercentuale},
    liquidita = ${p.liquidita},
    nota_liquidita = ${p.notaLiquidita},
    valuta = ${p.valuta},
    data_inizio = ${p.dataInizio},
    data_aggiornamento = ${p.dataAggiornamento}
  WHERE portfolio_id = ${pid}`;
}

// -- Categorie --
export async function createCategoria(c: Categoria): Promise<void> {
  const sql = getSQL();
  const pid = c.portfolioId ?? "basic";
  await sql`INSERT INTO categorie (id, nome, slug, peso_percentuale, costo, valore_attuale, profitto_o_perdita, pl_percentuale, dividendi, portfolio_id)
    VALUES (${c.id}, ${c.nome}, ${c.slug}, ${c.pesoPercentuale}, ${c.costo}, ${c.valoreAttuale}, ${c.profittoOPerdita}, ${c.plPercentuale}, ${c.dividendi}, ${pid})`;
}

export async function updateCategoria(id: string, c: Partial<Categoria>): Promise<void> {
  const sql = getSQL();
  const current = await sql`SELECT * FROM categorie WHERE id = ${id} LIMIT 1`;
  if (current.length === 0) return;
  const merged = { ...rowToCategoria(current[0]), ...c };
  await sql`UPDATE categorie SET
    nome = ${merged.nome}, slug = ${merged.slug}, peso_percentuale = ${merged.pesoPercentuale},
    costo = ${merged.costo}, valore_attuale = ${merged.valoreAttuale},
    profitto_o_perdita = ${merged.profittoOPerdita}, pl_percentuale = ${merged.plPercentuale},
    dividendi = ${merged.dividendi}
  WHERE id = ${id}`;
}

export async function deleteCategoria(id: string): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM categorie WHERE id = ${id}`;
}

// -- Titoli --
export async function createTitolo(t: Titolo): Promise<void> {
  const sql = getSQL();
  const pid = t.portfolioId ?? "basic";
  await sql`INSERT INTO titoli (ticker, nome, categoria, num_azioni, prezzo_medio_carico, costo, valore_attuale, peso_percentuale, var_prezzo, dividendi, profitto_o_perdita, pl_percentuale, pe_ratio, isin, asset_class, paese, settore, portfolio_id)
    VALUES (${t.ticker}, ${t.nome}, ${t.categoria}, ${t.numAzioni}, ${t.prezzoMedioCarico}, ${t.costo}, ${t.valoreAttuale}, ${t.pesoPercentuale}, ${t.varPrezzo}, ${t.dividendi}, ${t.profittoOPerdita}, ${t.plPercentuale}, ${t.peRatio}, ${t.isin}, ${t.assetClass}, ${t.paese}, ${t.settore}, ${pid})`;
}

export async function updateTitolo(ticker: string, t: Partial<Titolo>, portfolioId: PortfolioId = "basic"): Promise<void> {
  const sql = getSQL();
  const current = await sql`SELECT * FROM titoli WHERE ticker = ${ticker} AND portfolio_id = ${portfolioId} LIMIT 1`;
  if (current.length === 0) return;
  const merged = { ...rowToTitolo(current[0]), ...t };
  await sql`UPDATE titoli SET
    nome = ${merged.nome}, categoria = ${merged.categoria}, num_azioni = ${merged.numAzioni},
    prezzo_medio_carico = ${merged.prezzoMedioCarico}, costo = ${merged.costo},
    valore_attuale = ${merged.valoreAttuale}, peso_percentuale = ${merged.pesoPercentuale},
    var_prezzo = ${merged.varPrezzo}, dividendi = ${merged.dividendi},
    profitto_o_perdita = ${merged.profittoOPerdita}, pl_percentuale = ${merged.plPercentuale},
    pe_ratio = ${merged.peRatio}, isin = ${merged.isin}, asset_class = ${merged.assetClass},
    paese = ${merged.paese}, settore = ${merged.settore}
  WHERE ticker = ${ticker} AND portfolio_id = ${portfolioId}`;
}

export async function deleteTitolo(ticker: string, portfolioId: PortfolioId = "basic"): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM titoli WHERE ticker = ${ticker} AND portfolio_id = ${portfolioId}`;
}

// -- Dividendi --
export async function createDividendo(d: Dividendo, portfolioId: PortfolioId = "basic"): Promise<void> {
  const sql = getSQL();
  await sql`INSERT INTO dividendi (data, tipo, descrizione, ticker, importo, portfolio_id)
    VALUES (${d.data}, ${d.tipo}, ${d.descrizione}, ${d.ticker}, ${d.importo}, ${portfolioId})`;
}

export async function deleteDividendo(id: number): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM dividendi WHERE id = ${id}`;
}

// -- Operazioni --
export async function createOperazione(o: Operazione, portfolioId: PortfolioId = "basic"): Promise<void> {
  const sql = getSQL();
  if (o.tipo === "vendita") {
    const v = o as OperazioneVendita;
    await sql`INSERT INTO operazioni (data, tipo, ticker, nome, azioni_vendute, prezzo_acquisto, prezzo_vendita, utile_realizzato, percentuale, nota, portfolio_id)
      VALUES (${v.data}, ${v.tipo}, ${v.ticker}, ${v.nome}, ${v.azioniVendute}, ${v.prezzoAcquisto}, ${v.prezzoVendita}, ${v.utileRealizzato}, ${v.percentuale}, ${v.nota}, ${portfolioId})`;
  } else {
    const a = o as OperazioneAcquisto;
    await sql`INSERT INTO operazioni (data, tipo, ticker, nome, azioni_comprate, prezzo_acquisto, nota, portfolio_id)
      VALUES (${a.data}, ${a.tipo}, ${a.ticker}, ${a.nome}, ${a.azioniComprate}, ${a.prezzoAcquisto}, ${a.nota}, ${portfolioId})`;
  }
}

export async function deleteOperazione(id: number): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM operazioni WHERE id = ${id}`;
}

// -- Letture con ID (per admin) --

export interface DividendoConId extends Dividendo {
  id: number;
}

export interface OperazioneConId {
  id: number;
  data: string;
  tipo: "vendita" | "acquisto";
  ticker: string;
  nome: string;
  azioniVendute?: number;
  azioniComprate?: number;
  prezzoAcquisto: number;
  prezzoVendita?: number;
  utileRealizzato?: number;
  percentuale?: number;
  nota: string;
}

function rowToDividendoConId(r: Record<string, unknown>): DividendoConId {
  return {
    id: Number(r.id),
    data: toDateStr(r.data),
    tipo: "dividendo",
    descrizione: r.descrizione as string,
    ticker: r.ticker as string,
    importo: Number(r.importo),
  };
}

function rowToOperazioneConId(r: Record<string, unknown>): OperazioneConId {
  return {
    id: Number(r.id),
    data: toDateStr(r.data),
    tipo: r.tipo as "vendita" | "acquisto",
    ticker: r.ticker as string,
    nome: r.nome as string,
    azioniVendute: r.azioni_vendute != null ? Number(r.azioni_vendute) : undefined,
    azioniComprate: r.azioni_comprate != null ? Number(r.azioni_comprate) : undefined,
    prezzoAcquisto: Number(r.prezzo_acquisto),
    prezzoVendita: r.prezzo_vendita != null ? Number(r.prezzo_vendita) : undefined,
    utileRealizzato: r.utile_realizzato != null ? Number(r.utile_realizzato) : undefined,
    percentuale: r.percentuale != null ? Number(r.percentuale) : undefined,
    nota: (r.nota as string) ?? "",
  };
}

export async function getDividendiConId(portfolioId: PortfolioId = "basic"): Promise<DividendoConId[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM dividendi WHERE portfolio_id = ${portfolioId} ORDER BY data DESC`;
  return rows.map(rowToDividendoConId);
}

export async function getOperazioniConId(portfolioId: PortfolioId = "basic"): Promise<OperazioneConId[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM operazioni WHERE portfolio_id = ${portfolioId} ORDER BY data DESC`;
  return rows.map(rowToOperazioneConId);
}

export async function updateDividendo(id: number, d: Partial<DividendoConId>): Promise<void> {
  const sql = getSQL();
  const current = await sql`SELECT * FROM dividendi WHERE id = ${id} LIMIT 1`;
  if (current.length === 0) return;
  const merged = { ...rowToDividendoConId(current[0]), ...d };
  await sql`UPDATE dividendi SET
    data = ${merged.data}, descrizione = ${merged.descrizione},
    ticker = ${merged.ticker}, importo = ${merged.importo}
  WHERE id = ${id}`;
}

export async function updateOperazione(id: number, o: Partial<OperazioneConId>): Promise<void> {
  const sql = getSQL();
  const current = await sql`SELECT * FROM operazioni WHERE id = ${id} LIMIT 1`;
  if (current.length === 0) return;
  const cur = rowToOperazioneConId(current[0]);
  const merged = { ...cur, ...o };
  if (merged.tipo === "vendita") {
    await sql`UPDATE operazioni SET
      data = ${merged.data}, tipo = ${merged.tipo}, ticker = ${merged.ticker}, nome = ${merged.nome},
      azioni_vendute = ${merged.azioniVendute ?? 0}, prezzo_acquisto = ${merged.prezzoAcquisto},
      prezzo_vendita = ${merged.prezzoVendita ?? 0}, utile_realizzato = ${merged.utileRealizzato ?? 0},
      percentuale = ${merged.percentuale ?? 0}, nota = ${merged.nota}
    WHERE id = ${id}`;
  } else {
    await sql`UPDATE operazioni SET
      data = ${merged.data}, tipo = ${merged.tipo}, ticker = ${merged.ticker}, nome = ${merged.nome},
      azioni_comprate = ${merged.azioniComprate ?? 0}, prezzo_acquisto = ${merged.prezzoAcquisto},
      nota = ${merged.nota}
    WHERE id = ${id}`;
  }
}

export async function addStorico(punto: PuntoStorico, portfolioId: PortfolioId = "basic"): Promise<void> {
  const sql = getSQL();
  await sql`INSERT INTO storico (data, valore, portfolio_id) VALUES (${punto.data}, ${punto.valore}, ${portfolioId})
    ON CONFLICT (portfolio_id, data) DO UPDATE SET valore = ${punto.valore}`;
}

export async function getTitoloByTicker(ticker: string, portfolioId: PortfolioId = "basic"): Promise<Titolo | null> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM titoli WHERE ticker = ${ticker} AND portfolio_id = ${portfolioId} LIMIT 1`;
  return rows.length > 0 ? rowToTitolo(rows[0]) : null;
}

export async function getCategoriaById(id: string): Promise<Categoria | null> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM categorie WHERE id = ${id} LIMIT 1`;
  return rows.length > 0 ? rowToCategoria(rows[0]) : null;
}

export async function getDividendiTotaleAnno(portfolioId: PortfolioId, anno: number): Promise<number> {
  const sql = getSQL();
  const rows = await sql`SELECT COALESCE(SUM(importo), 0) AS totale FROM dividendi WHERE portfolio_id = ${portfolioId} AND EXTRACT(YEAR FROM data) = ${anno}`;
  return Number(rows[0].totale);
}

// -- Flussi Capitale --

export async function getFlussiCapitale(portfolioId: PortfolioId = "basic"): Promise<FlussoCapitale[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM flussi_capitale WHERE portfolio_id = ${portfolioId} ORDER BY data ASC`;
  return rows.map(rowToFlussoCapitale);
}

export async function getFlussiCapitaleDa(portfolioId: PortfolioId, dataInizio: string): Promise<FlussoCapitale[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM flussi_capitale WHERE portfolio_id = ${portfolioId} AND data >= ${dataInizio} ORDER BY data ASC`;
  return rows.map(rowToFlussoCapitale);
}

export async function addFlussoCapitale(f: Omit<FlussoCapitale, "id">, portfolioId: PortfolioId = "basic"): Promise<void> {
  const sql = getSQL();
  await sql`INSERT INTO flussi_capitale (data, tipo, importo, valore_pre, capitale_post, nota, portfolio_id)
    VALUES (${f.data}, ${f.tipo}, ${f.importo}, ${f.valorePre}, ${f.capitalePost}, ${f.nota}, ${portfolioId})`;
}

export async function updateFlussoCapitale(id: number, f: Partial<FlussoCapitale>): Promise<void> {
  const sql = getSQL();
  const current = await sql`SELECT * FROM flussi_capitale WHERE id = ${id} LIMIT 1`;
  if (current.length === 0) return;
  const merged = { ...rowToFlussoCapitale(current[0]), ...f };
  await sql`UPDATE flussi_capitale SET
    data = ${merged.data}, tipo = ${merged.tipo}, importo = ${merged.importo},
    valore_pre = ${merged.valorePre}, capitale_post = ${merged.capitalePost}, nota = ${merged.nota}
  WHERE id = ${id}`;
}

export async function deleteFlussoCapitale(id: number): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM flussi_capitale WHERE id = ${id}`;
}

export async function updateInvestimentoIniziale(valore: number, portfolioId: PortfolioId = "basic"): Promise<void> {
  const sql = getSQL();
  await sql`UPDATE portafoglio SET investimento_iniziale = ${valore} WHERE portfolio_id = ${portfolioId}`;
}

export async function getCapitaleInvestitoCorrente(portfolioId: PortfolioId = "basic"): Promise<number> {
  const sql = getSQL();
  const rows = await sql`SELECT capitale_post FROM flussi_capitale WHERE portfolio_id = ${portfolioId} ORDER BY data DESC LIMIT 1`;
  if (rows.length > 0) return Number(rows[0].capitale_post);
  const portafoglio = await sql`SELECT investimento_iniziale FROM portafoglio WHERE portfolio_id = ${portfolioId} LIMIT 1`;
  if (portafoglio.length === 0) throw new Error("Portafoglio non trovato");
  return Number(portafoglio[0].investimento_iniziale);
}

// --------------- WATCHLIST ---------------

function rowToWatchlistItem(r: Record<string, unknown>): WatchlistItem {
  return {
    id: Number(r.id),
    ticker: r.ticker as string,
    tickerYahoo: (r.ticker_yahoo as string | null) ?? null,
    nome: r.nome as string,
    settore: r.settore as Settore,
    paese: r.paese as Paese,
    assetClass: r.asset_class as AssetClass,
    descrizione: (r.descrizione as string) ?? "",
    targetPrice: r.target_price != null ? Number(r.target_price) : null,
    rating: (r.rating as WatchlistRating | null) ?? null,
    peRatio: r.pe_ratio != null ? Number(r.pe_ratio) : null,
    dividendYield: r.dividend_yield != null ? Number(r.dividend_yield) : null,
    metricheExtra: (r.metriche_extra as Record<string, string | number>) ?? {},
    analisiTesto: (r.analisi_testo as string | null) ?? null,
    dataInserimento: toDateStr(r.data_inserimento),
    dataAggiornamento: toDateStr(r.data_aggiornamento),
  };
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM watchlist ORDER BY data_inserimento DESC`;
  return rows.map(rowToWatchlistItem);
}

export async function getWatchlistItem(id: number): Promise<WatchlistItem | null> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM watchlist WHERE id = ${id} LIMIT 1`;
  return rows.length > 0 ? rowToWatchlistItem(rows[0]) : null;
}

export async function getWatchlistItemByTicker(ticker: string): Promise<WatchlistItem | null> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM watchlist WHERE ticker = ${ticker} LIMIT 1`;
  return rows.length > 0 ? rowToWatchlistItem(rows[0]) : null;
}

export async function createWatchlistItem(item: Omit<WatchlistItem, "id">): Promise<number> {
  const sql = getSQL();
  const rows = await sql`INSERT INTO watchlist (ticker, ticker_yahoo, nome, settore, paese, asset_class, descrizione, target_price, rating, pe_ratio, dividend_yield, metriche_extra, analisi_testo, data_inserimento, data_aggiornamento)
    VALUES (${item.ticker}, ${item.tickerYahoo}, ${item.nome}, ${item.settore}, ${item.paese}, ${item.assetClass}, ${item.descrizione}, ${item.targetPrice}, ${item.rating}, ${item.peRatio}, ${item.dividendYield}, ${JSON.stringify(item.metricheExtra)}, ${item.analisiTesto}, ${item.dataInserimento}, ${item.dataAggiornamento})
    RETURNING id`;
  return Number(rows[0].id);
}

export async function updateWatchlistItem(id: number, item: Partial<WatchlistItem>): Promise<void> {
  const sql = getSQL();
  const current = await sql`SELECT * FROM watchlist WHERE id = ${id} LIMIT 1`;
  if (current.length === 0) return;
  const merged = { ...rowToWatchlistItem(current[0]), ...item };
  await sql`UPDATE watchlist SET
    ticker = ${merged.ticker}, ticker_yahoo = ${merged.tickerYahoo}, nome = ${merged.nome}, settore = ${merged.settore},
    paese = ${merged.paese}, asset_class = ${merged.assetClass}, descrizione = ${merged.descrizione},
    target_price = ${merged.targetPrice}, rating = ${merged.rating},
    pe_ratio = ${merged.peRatio}, dividend_yield = ${merged.dividendYield},
    metriche_extra = ${JSON.stringify(merged.metricheExtra)}, analisi_testo = ${merged.analisiTesto},
    data_aggiornamento = ${merged.dataAggiornamento}
  WHERE id = ${id}`;
}

export async function deleteWatchlistItem(id: number): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM watchlist WHERE id = ${id}`;
}
