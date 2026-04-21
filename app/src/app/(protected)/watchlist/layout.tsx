import { headers } from "next/headers";
import WatchlistSidebar from "@/components/WatchlistSidebar";
import type { UserRole } from "@/types/portafoglio";

export default async function WatchlistLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const ruolo = (headersList.get("x-user-role") as UserRole) || "user";

  return (
    <div className="min-h-screen bg-grigio-sfondo">
      <WatchlistSidebar ruolo={ruolo} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 pt-16 md:p-6 lg:pt-6">{children}</div>
      </main>
    </div>
  );
}
