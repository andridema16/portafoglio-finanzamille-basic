import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { isValidPortfolioId } from "@/lib/portfolio";
import type { UserRole } from "@/types/portafoglio";

export default async function PortfolioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ portfolio: string }>;
}) {
  const { portfolio } = await params;

  if (!isValidPortfolioId(portfolio)) {
    notFound();
  }

  const headersList = await headers();
  const ruolo = (headersList.get("x-user-role") as UserRole) || "user";

  return (
    <div className="min-h-screen bg-grigio-sfondo">
      <Sidebar ruolo={ruolo} portfolioId={portfolio} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 pt-16 md:p-6 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
