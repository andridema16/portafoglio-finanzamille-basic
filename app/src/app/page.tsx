"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/portafoglio";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    setCaricamento(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data: { success: boolean; role: UserRole } = await res.json();
        if (data.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/scegli-portafoglio");
        }
      } else {
        setErrore("Password errata. Riprova.");
      }
    } catch {
      setErrore("Errore di connessione. Riprova.");
    } finally {
      setCaricamento(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-grigio-sfondo min-h-screen">
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="flex flex-col items-center">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-nero">Finanz</span>
              <span className="text-verde-primario">Amille</span>
            </h1>
            <p className="text-nero text-lg font-medium mt-1 tracking-wide">
              Portafoglio
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-nero focus:outline-none focus:ring-2 focus:ring-verde-primario focus:border-transparent text-base"
                required
                autoFocus
              />
            </div>

            {errore && (
              <p className="text-rosso-perdita text-sm text-center">{errore}</p>
            )}

            <button
              type="submit"
              disabled={caricamento}
              className="w-full py-3 bg-verde-scuro text-white font-medium rounded-xl hover:bg-verde-scuro/90 transition-colors disabled:opacity-50 text-base cursor-pointer"
            >
              {caricamento ? "Accesso in corso..." : "Accedi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
