"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/types/portafoglio";

interface Props {
  ruolo: UserRole;
}

const adminNavItems = [
  { label: "Pannello Admin", href: "/admin" },
  { label: "Gestione Titoli", href: "/admin/titoli" },
  { label: "Gestione Categorie", href: "/admin/categorie" },
  { label: "Gestione Transazioni", href: "/admin/transazioni" },
  { label: "Flussi Capitale", href: "/admin/flussi" },
  { label: "Aggiorna Prezzi", href: "/admin/prezzi" },
  { label: "Gestione Watchlist", href: "/admin/watchlist" },
];

export default function WatchlistSidebar({ ruolo }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [gestioneOpen, setGestioneOpen] = useState(true);

  const isActive = (href: string) => pathname === href;

  const navContent = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Link href="/watchlist" className="flex items-center gap-3">
          <Image src="/icon.png" alt="FinanzaMille" width={32} height={32} />
          <span className="text-white font-semibold text-sm">Watchlist</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <Link
          href="/watchlist"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive("/watchlist")
              ? "bg-white/15 text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          Watchlist
        </Link>

        {/* Sezione Gestione (solo admin) */}
        {ruolo === "admin" && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => setGestioneOpen(!gestioneOpen)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <span>Gestione</span>
              <svg
                className={`w-4 h-4 transition-transform ${gestioneOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {gestioneOpen && (
              <div className="ml-3 space-y-0.5">
                {adminNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive(item.href)
                        ? "bg-white/15 text-white font-medium"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link
          href="/scegli-portafoglio"
          onClick={() => setMobileOpen(false)}
          className="flex items-center px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          Scegli portafoglio
        </Link>

        <p className="px-3 pt-1 text-white/30 text-xs">&copy; 2026 FinanzaMille</p>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-verde-scuro text-white shadow-lg cursor-pointer"
        aria-label="Apri menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-verde-scuro transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-white/60 hover:text-white cursor-pointer"
          aria-label="Chiudi menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-verde-scuro">
        {navContent}
      </aside>
    </>
  );
}
