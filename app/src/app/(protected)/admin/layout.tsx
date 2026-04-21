import { headers } from "next/headers";
import Sidebar from "@/components/Sidebar";
import type { UserRole } from "@/types/portafoglio";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const ruolo = (headersList.get("x-user-role") as UserRole) || "user";

  return (
    <div className="min-h-screen bg-grigio-sfondo">
      <Sidebar ruolo={ruolo} portfolioId="basic" />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
