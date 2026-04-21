import { createHmac } from "crypto";
import { neon } from "@neondatabase/serverless";

/**
 * Calcola il 2° lunedì di un dato mese.
 */
function getSecondMonday(year: number, month: number): Date {
  const first = new Date(year, month, 1);
  const day = first.getDay();
  const firstMonday = day <= 1 ? 1 + (1 - day) : 1 + (8 - day);
  const secondMonday = firstMonday + 7;
  return new Date(year, month, secondMonday);
}

/**
 * Chiave del periodo corrente. Cambia ogni 2° lunedì del mese.
 */
function getCurrentPeriodKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const secondMonday = getSecondMonday(year, month);

  if (now >= secondMonday) {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  }
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;
}

/**
 * Genera password automatica dal periodo e dal secret.
 */
function derivePassword(periodKey: string, secret: string): string {
  const hash = createHmac("sha256", secret)
    .update(`site-password:${periodKey}`)
    .digest("hex");
  return `FM${hash.slice(0, 6)}`;
}

// --------------- DB helpers ---------------

function getSQL() {
  return neon(process.env.DATABASE_URL!);
}

async function getImpostazione(chiave: string): Promise<string | null> {
  const sql = getSQL();
  const rows = await sql`SELECT valore FROM impostazioni WHERE chiave = ${chiave} LIMIT 1`;
  return rows.length > 0 ? (rows[0].valore as string) : null;
}

async function setImpostazione(chiave: string, valore: string): Promise<void> {
  const sql = getSQL();
  await sql`INSERT INTO impostazioni (chiave, valore) VALUES (${chiave}, ${valore})
    ON CONFLICT (chiave) DO UPDATE SET valore = ${valore}`;
}

async function deleteImpostazione(chiave: string): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM impostazioni WHERE chiave = ${chiave}`;
}

// --------------- API pubblica ---------------

/**
 * Restituisce la password utente corrente.
 * Se esiste una password manuale nel DB, usa quella.
 * Altrimenti genera quella automatica.
 */
export async function getCurrentSitePassword(): Promise<string> {
  const manuale = await getImpostazione("password_manuale");
  if (manuale) return manuale;

  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET non configurato");
  return derivePassword(getCurrentPeriodKey(), secret);
}

/**
 * Info per il pannello admin.
 */
export async function getPasswordInfo(): Promise<{
  passwordCorrente: string;
  modalita: "manuale" | "automatica";
  periodCorrente: string;
  prossimoCambio: string;
  prossimaPassword: string;
}> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET non configurato");

  const manuale = await getImpostazione("password_manuale");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const secondMondayThisMonth = getSecondMonday(year, month);

  let nextChangeDate: Date;
  let nextPeriodKey: string;

  if (now >= secondMondayThisMonth) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    nextChangeDate = getSecondMonday(nextYear, nextMonth);
    nextPeriodKey = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}`;
  } else {
    nextChangeDate = secondMondayThisMonth;
    nextPeriodKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  }

  const currentPeriod = getCurrentPeriodKey();
  const autoPassword = derivePassword(currentPeriod, secret);

  return {
    passwordCorrente: manuale ?? autoPassword,
    modalita: manuale ? "manuale" : "automatica",
    periodCorrente: currentPeriod,
    prossimoCambio: nextChangeDate.toISOString().slice(0, 10),
    prossimaPassword: derivePassword(nextPeriodKey, secret),
  };
}

/**
 * Imposta una password manuale (sovrascrive quella automatica).
 */
export async function setPasswordManuale(password: string): Promise<void> {
  await setImpostazione("password_manuale", password);
}

/**
 * Rimuove la password manuale, tornando a quella automatica.
 */
export async function removePasswordManuale(): Promise<void> {
  await deleteImpostazione("password_manuale");
}
