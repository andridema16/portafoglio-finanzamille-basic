import type { PortfolioId } from "@/types/portafoglio";

export interface PortfolioMeta {
  id: PortfolioId;
  nome: string;
  descrizione: string;
  valuta: "USD" | "EUR";
  attivo: boolean;
}

export const PORTFOLIOS: Record<PortfolioId, PortfolioMeta> = {
  basic: {
    id: "basic",
    nome: "Portafoglio Basic",
    descrizione:
      "Portafoglio conservativo con ETF europei: obbligazioni, azionario globale e oro.",
    valuta: "EUR",
    attivo: true,
  },
};

export function isValidPortfolioId(id: string): id is PortfolioId {
  return id === "basic";
}

export function getPortfolioMeta(id: PortfolioId): PortfolioMeta {
  return PORTFOLIOS[id];
}

interface NavItem {
  label: string;
  href: string;
}

export function getNavItems(portfolioId: PortfolioId): NavItem[] {
  return [
    { label: "Dashboard", href: `/${portfolioId}/dashboard` },
    { label: "Composizione", href: `/${portfolioId}/composizione` },
    { label: "Ribilanciamenti", href: `/${portfolioId}/ribilanciamenti` },
  ];
}
