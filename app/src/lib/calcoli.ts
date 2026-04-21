import type { Titolo, Categoria, Portafoglio, FlussoCapitale, OperazioneVendita, OperazioneAcquisto, Dividendo } from "@/types/portafoglio";

/**
 * Ricalcola un titolo sostituendo il prezzo live.
 * Se prezzoLive è null, ritorna il titolo invariato (fallback al valore DB).
 */
export function calcolaTitoloConPrezzoLive(
  titolo: Titolo,
  prezzoLive: number | null
): Titolo {
  // Il costo totale reale è sempre numAzioni * prezzoMedioCarico
  const costoTotale = titolo.numAzioni * titolo.prezzoMedioCarico;

  if (prezzoLive == null) {
    // Anche senza prezzo live, ricalcola P&L col costo corretto (inclusi dividendi)
    const profittoOPerdita = titolo.valoreAttuale - costoTotale + titolo.dividendi;
    const plPercentuale = costoTotale > 0 ? (profittoOPerdita / costoTotale) * 100 : 0;
    return {
      ...titolo,
      costo: costoTotale,
      profittoOPerdita,
      plPercentuale,
    };
  }

  const valoreAttuale = titolo.numAzioni * prezzoLive;
  const profittoOPerdita = valoreAttuale - costoTotale + titolo.dividendi;
  const plPercentuale = costoTotale > 0 ? (profittoOPerdita / costoTotale) * 100 : 0;
  const varPrezzo = prezzoLive - titolo.prezzoMedioCarico;

  return {
    ...titolo,
    costo: costoTotale,
    valoreAttuale,
    profittoOPerdita,
    plPercentuale,
    varPrezzo,
  };
}

/**
 * Ricalcola una categoria a partire dai titoli aggiornati.
 * Ricalcola: valoreAttuale, profittoOPerdita, plPercentuale, dividendi, pesi percentuali dei titoli.
 */
export function ricalcolaCategoriaConTitoli(
  categoria: Categoria,
  titoliAggiornati: Titolo[],
  totalPortafoglio?: number
): { categoria: Categoria; titoli: Titolo[] } {
  const valoreAttuale = titoliAggiornati.reduce((s, t) => s + t.valoreAttuale, 0);
  const costo = titoliAggiornati.reduce((s, t) => s + t.costo, 0);
  const dividendi = titoliAggiornati.reduce((s, t) => s + t.dividendi, 0);
  const profittoOPerdita = valoreAttuale - costo + dividendi;
  const plPercentuale = costo > 0 ? (profittoOPerdita / costo) * 100 : 0;

  // Peso % di ciascun titolo: sul portafoglio totale se disponibile, altrimenti sulla categoria
  const base = totalPortafoglio ?? valoreAttuale;
  const titoli = titoliAggiornati.map((t) => ({
    ...t,
    pesoPercentuale: base > 0 ? (t.valoreAttuale / base) * 100 : 0,
  }));

  const pesoPercentuale =
    totalPortafoglio && totalPortafoglio > 0
      ? (valoreAttuale / totalPortafoglio) * 100
      : categoria.pesoPercentuale;

  return {
    categoria: {
      ...categoria,
      valoreAttuale,
      costo,
      profittoOPerdita,
      plPercentuale,
      dividendi,
      pesoPercentuale,
    },
    titoli,
  };
}

/**
 * Ricalcola il riepilogo del portafoglio a partire dalle categorie aggiornate.
 */
export function ricalcolaPortafoglioConTitoli(
  portafoglio: Portafoglio,
  categorieAggiornate: Categoria[]
): Portafoglio {
  const valoreAttuale = categorieAggiornate.reduce((s, c) => s + c.valoreAttuale, 0);
  const totaleDividendi = categorieAggiornate.reduce((s, c) => s + c.dividendi, 0);
  const profittoOPerdita = valoreAttuale - portafoglio.investimentoIniziale + totaleDividendi;
  const varPercentuale =
    portafoglio.investimentoIniziale > 0
      ? (profittoOPerdita / portafoglio.investimentoIniziale) * 100
      : 0;

  // Ricalcola peso % di ciascuna categoria (NB: muta l'input per efficienza)
  for (const cat of categorieAggiornate) {
    cat.pesoPercentuale =
      valoreAttuale > 0 ? (cat.valoreAttuale / valoreAttuale) * 100 : 0;
  }

  return {
    ...portafoglio,
    valoreAttuale,
    profittoOPerdita,
    varPercentuale,
  };
}

// --------------- Calcoli automatici per operazioni admin ---------------

export interface RisultatoVendita {
  operazione: OperazioneVendita;
  titoloAggiornato: Titolo;
  deltaLiquidita: number;
  utileRealizzato: number;
  titoloEliminato: boolean;
}

/**
 * Calcola tutti i dati di una vendita a partire dal titolo in DB e i dati minimi.
 * Ricava automaticamente: nome, prezzoAcquisto, utileRealizzato, percentuale.
 * Aggiorna il titolo: riduce numAzioni, ricalcola costo/valoreAttuale/P&L.
 */
export function calcolaVendita(
  titolo: Titolo,
  azioniVendute: number,
  prezzoVendita: number,
  data: string,
  nota: string = ""
): RisultatoVendita {
  const prezzoAcquisto = titolo.prezzoMedioCarico;
  const utile = (prezzoVendita - prezzoAcquisto) * azioniVendute;
  const percentuale = prezzoAcquisto > 0 ? ((prezzoVendita - prezzoAcquisto) / prezzoAcquisto) * 100 : 0;

  const operazione: OperazioneVendita = {
    data,
    tipo: "vendita",
    ticker: titolo.ticker,
    nome: titolo.nome,
    azioniVendute,
    prezzoAcquisto,
    prezzoVendita,
    utileRealizzato: utile,
    percentuale,
    nota,
  };

  const nuoveAzioni = titolo.numAzioni - azioniVendute;
  const titoloEliminato = nuoveAzioni <= 0;

  // Prezzo per azione corrente (dal valoreAttuale prima della vendita)
  const prezzoCorrentePerAzione = titolo.numAzioni > 0
    ? titolo.valoreAttuale / titolo.numAzioni
    : 0;

  const nuovoCosto = nuoveAzioni * prezzoAcquisto;
  const nuovoValore = nuoveAzioni * prezzoCorrentePerAzione;
  const nuovoPL = nuovoValore - nuovoCosto + titolo.dividendi;
  const nuovoPLPerc = nuovoCosto > 0 ? (nuovoPL / nuovoCosto) * 100 : 0;

  const titoloAggiornato: Titolo = {
    ...titolo,
    numAzioni: Math.max(nuoveAzioni, 0),
    costo: nuovoCosto,
    valoreAttuale: nuovoValore,
    profittoOPerdita: nuovoPL,
    plPercentuale: nuovoPLPerc,
  };

  return {
    operazione,
    titoloAggiornato,
    deltaLiquidita: azioniVendute * prezzoVendita,
    utileRealizzato: utile,
    titoloEliminato,
  };
}

export interface RisultatoAcquisto {
  operazione: OperazioneAcquisto;
  titoloAggiornato: Titolo;
  deltaLiquidita: number;
  nuovoTitolo: boolean;
}

/**
 * Calcola tutti i dati di un acquisto.
 * Se il titolo esiste: ricalcola prezzoMedioCarico come media ponderata.
 * Se è un nuovo titolo: crea il titolo da zero (richiede dati extra).
 */
export function calcolaAcquisto(
  titolo: Titolo,
  azioniComprate: number,
  prezzoAcquisto: number,
  data: string,
  nota: string = ""
): RisultatoAcquisto {
  const operazione: OperazioneAcquisto = {
    data,
    tipo: "acquisto",
    ticker: titolo.ticker,
    nome: titolo.nome,
    azioniComprate,
    prezzoAcquisto,
    nota,
  };

  const nuovoTitolo = titolo.numAzioni === 0;
  const vecchioCosto = titolo.numAzioni * titolo.prezzoMedioCarico;
  const costoNuoveAzioni = azioniComprate * prezzoAcquisto;
  const nuoveAzioni = titolo.numAzioni + azioniComprate;

  // Media ponderata del prezzo di carico
  const nuovoPrezzoMedio = nuoveAzioni > 0
    ? (vecchioCosto + costoNuoveAzioni) / nuoveAzioni
    : prezzoAcquisto;

  const nuovoCosto = nuoveAzioni * nuovoPrezzoMedio;

  // Prezzo corrente per azione: se il titolo aveva azioni, usa il prezzo corrente;
  // altrimenti usa il prezzoAcquisto come stima iniziale
  const prezzoCorrentePerAzione = titolo.numAzioni > 0
    ? titolo.valoreAttuale / titolo.numAzioni
    : prezzoAcquisto;

  const nuovoValore = nuoveAzioni * prezzoCorrentePerAzione;
  const nuovoPL = nuovoValore - nuovoCosto + titolo.dividendi;
  const nuovoPLPerc = nuovoCosto > 0 ? (nuovoPL / nuovoCosto) * 100 : 0;
  const varPrezzo = prezzoCorrentePerAzione - nuovoPrezzoMedio;

  const titoloAggiornato: Titolo = {
    ...titolo,
    numAzioni: nuoveAzioni,
    prezzoMedioCarico: nuovoPrezzoMedio,
    costo: nuovoCosto,
    valoreAttuale: nuovoValore,
    profittoOPerdita: nuovoPL,
    plPercentuale: nuovoPLPerc,
    varPrezzo,
  };

  return {
    operazione,
    titoloAggiornato,
    deltaLiquidita: -costoNuoveAzioni,
    nuovoTitolo,
  };
}

export interface RisultatoDividendo {
  dividendo: Dividendo;
  titoloAggiornato: Titolo;
  deltaLiquidita: number;
}

/**
 * Calcola i dati di un dividendo e aggiorna il titolo.
 * Auto-genera la descrizione se non fornita.
 */
export function calcolaDividendo(
  titolo: Titolo,
  importo: number,
  data: string,
  descrizione?: string
): RisultatoDividendo {
  const dividendo: Dividendo = {
    data,
    tipo: "dividendo",
    descrizione: descrizione || `${titolo.nome} (${titolo.ticker}) - Dividendo`,
    ticker: titolo.ticker,
    importo,
  };

  const nuoviDividendi = titolo.dividendi + importo;
  const costoTotale = titolo.numAzioni * titolo.prezzoMedioCarico;
  const nuovoPL = titolo.valoreAttuale - costoTotale + nuoviDividendi;
  const nuovoPLPerc = costoTotale > 0 ? (nuovoPL / costoTotale) * 100 : 0;

  const titoloAggiornato: Titolo = {
    ...titolo,
    dividendi: nuoviDividendi,
    profittoOPerdita: nuovoPL,
    plPercentuale: nuovoPLPerc,
  };

  return {
    dividendo,
    titoloAggiornato,
    deltaLiquidita: importo,
  };
}

/**
 * Ricalcola un titolo dopo aggiornamento manuale del prezzo.
 */
export function calcolaAggiornamentoPrezzo(
  titolo: Titolo,
  nuovoPrezzo: number
): Titolo {
  return calcolaTitoloConPrezzoLive(titolo, nuovoPrezzo);
}

/**
 * Calcola il valore del portafoglio subito dopo un flusso di capitale.
 * Questo è il valore di inizio del periodo successivo.
 */
function valoreDopoFlusso(flusso: FlussoCapitale): number {
  switch (flusso.tipo) {
    case "inizio":
      return flusso.capitalePost;
    case "deposito":
      return flusso.valorePre + flusso.importo;
    case "prelievo":
      return flusso.valorePre - flusso.importo;
  }
}

/**
 * Calcola il rendimento time-weighted (TWR) del portafoglio.
 *
 * Il TWR elimina l'effetto di depositi/prelievi misurando la performance
 * pura degli investimenti. Si calcola come prodotto dei rendimenti
 * di ciascun sotto-periodo delimitato dai flussi di capitale.
 *
 * @param flussi - Array di flussi di capitale ordinati per data ASC.
 *                 Il primo flusso deve essere di tipo "inizio".
 * @param valoreAttuale - Valore corrente del portafoglio.
 * @returns TWR come decimale (es. 0.05 per +5%, -0.02 per -2%).
 */
export function calcolaTWR(
  flussi: FlussoCapitale[],
  valoreAttuale: number
): number {
  if (flussi.length === 0) {
    return 0;
  }

  // Caso con solo flusso "inizio"
  if (flussi.length === 1) {
    const valoreInizio = valoreDopoFlusso(flussi[0]);
    if (valoreInizio <= 0) {
      return 0;
    }
    return (valoreAttuale / valoreInizio) - 1;
  }

  // Calcola HPR per ogni sotto-periodo
  let prodottoHPR = 1;

  for (let i = 0; i < flussi.length; i++) {
    const valoreInizio = valoreDopoFlusso(flussi[i]);

    // Salta periodi con valore inizio <= 0 (evita divisione per 0)
    if (valoreInizio <= 0) {
      continue;
    }

    // Valore fine periodo: valorePre del flusso successivo, o valoreAttuale per l'ultimo
    const valoreFine =
      i < flussi.length - 1
        ? flussi[i + 1].valorePre
        : valoreAttuale;

    const hpr = valoreFine / valoreInizio;
    prodottoHPR *= hpr;
  }

  return prodottoHPR - 1;
}
