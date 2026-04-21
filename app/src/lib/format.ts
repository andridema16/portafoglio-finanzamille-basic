export function formatValuta(valore: number, valuta: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: valuta,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valore);
}

export function formatValutaDecimali(valore: number, valuta: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: valuta,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valore);
}

export function formatPercentuale(valore: number): string {
  return `${valore >= 0 ? "+" : ""}${valore.toFixed(2)}%`;
}

export function formatNumero(valore: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valore);
}

export function colorePL(valore: number): string {
  if (valore > 0) return "text-verde-guadagno";
  if (valore < 0) return "text-rosso-perdita";
  return "text-nero";
}

export function formatData(data: string): string {
  const [anno, mese, giorno] = data.split("-");
  return `${giorno}/${mese}/${anno}`;
}
