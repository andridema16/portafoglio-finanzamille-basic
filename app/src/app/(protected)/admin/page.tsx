"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { PortfolioId } from "@/types/portafoglio";

interface Stats {
  titoli: number;
  categorie: number;
  dividendi: number;
  operazioni: number;
  dataAggiornamento: string;
}

interface PasswordInfo {
  passwordCorrente: string;
  modalita: "manuale" | "automatica";
  periodCorrente: string;
  prossimoCambio: string;
  prossimaPassword: string;
}

export default function AdminDashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioId>("basic");
  const [stats, setStats] = useState<Stats | null>(null);
  const [pwInfo, setPwInfo] = useState<PasswordInfo | null>(null);
  const [ricalcolo, setRicalcolo] = useState(false);
  const [risultato, setRisultato] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [copiata, setCopiata] = useState(false);
  const [pwManuale, setPwManuale] = useState("");
  const [pwSalvataggio, setPwSalvataggio] = useState(false);

  useEffect(() => {
    caricaStats();
    caricaPassword();
  }, [portfolio]);

  async function caricaStats() {
    try {
      const q = `?portfolio=${portfolio}`;
      const [titoliRes, catRes, transRes] = await Promise.all([
        fetch(`/api/admin/titoli${q}`),
        fetch(`/api/admin/categorie${q}`),
        fetch(`/api/admin/transazioni${q}`),
      ]);

      const titoli = await titoliRes.json();
      const categorie = await catRes.json();
      const trans = await transRes.json();

      setStats({
        titoli: Array.isArray(titoli) ? titoli.length : 0,
        categorie: Array.isArray(categorie) ? categorie.length : 0,
        dividendi: Array.isArray(trans.dividendi) ? trans.dividendi.length : 0,
        operazioni: Array.isArray(trans.operazioni) ? trans.operazioni.length : 0,
        dataAggiornamento: new Date().toISOString().slice(0, 10),
      });
    } catch {
      setErrore("Errore nel caricamento dei dati");
    }
  }

  async function caricaPassword() {
    try {
      const res = await fetch("/api/admin/password");
      if (res.ok) {
        const data = await res.json();
        setPwInfo(data);
      }
    } catch {
      // non critico
    }
  }

  async function copiaPassword() {
    if (!pwInfo) return;
    await navigator.clipboard.writeText(pwInfo.passwordCorrente);
    setCopiata(true);
    setTimeout(() => setCopiata(false), 2000);
  }

  async function impostaPasswordManuale() {
    if (!pwManuale.trim() || pwManuale.trim().length < 4) return;
    setPwSalvataggio(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwManuale.trim() }),
      });
      if (res.ok) {
        setPwManuale("");
        await caricaPassword();
      }
    } catch {
      // errore silenzioso
    } finally {
      setPwSalvataggio(false);
    }
  }

  async function tornaAutomatica() {
    setPwSalvataggio(true);
    try {
      const res = await fetch("/api/admin/password", { method: "DELETE" });
      if (res.ok) {
        await caricaPassword();
      }
    } catch {
      // errore silenzioso
    } finally {
      setPwSalvataggio(false);
    }
  }

  async function ricalcolaPrezzi() {
    setRicalcolo(true);
    setRisultato(null);
    setErrore(null);

    try {
      const res = await fetch("/api/admin/ricalcola", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioId: portfolio }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore nel ricalcolo");
      }

      setRisultato(
        `Ricalcolo completato: ${data.titoli} titoli aggiornati. Valore attuale: $${data.valoreAttuale?.toFixed(2)}`
      );
      caricaStats();
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setRicalcolo(false);
    }
  }

  function formatDataItaliana(dataStr: string): string {
    const [anno, mese, giorno] = dataStr.split("-");
    return `${giorno}/${mese}/${anno}`;
  }

  const cards = [
    { label: "Titoli", valore: stats?.titoli ?? "-", href: "/admin/titoli", colore: "bg-verde-scuro" },
    { label: "Categorie", valore: stats?.categorie ?? "-", href: "/admin/categorie", colore: "bg-verde-primario" },
    { label: "Dividendi", valore: stats?.dividendi ?? "-", href: "/admin/transazioni", colore: "bg-verde-scuro" },
    { label: "Operazioni", valore: stats?.operazioni ?? "-", href: "/admin/transazioni", colore: "bg-verde-primario" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-nero mb-6">Pannello Amministrazione</h1>

      {/* Selettore Portafoglio */}
      <div className="flex gap-2 mb-6">
        {(["basic"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPortfolio(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              portfolio === p
                ? "bg-verde-scuro text-white"
                : "bg-white text-nero/60 hover:bg-gray-100"
            }`}
          >
            {"Basic"}
          </button>
        ))}
      </div>

      {/* Contatori */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-nero">{card.valore}</p>
          </Link>
        ))}
      </div>

      {/* Password Clienti */}
      {pwInfo && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-nero">Password Clienti</h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                pwInfo.modalita === "manuale"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-verde-guadagno"
              }`}
            >
              {pwInfo.modalita === "manuale" ? "Manuale" : "Automatica"}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {pwInfo.modalita === "automatica"
              ? "La password cambia automaticamente ogni 2° lunedi del mese."
              : "Stai usando una password impostata manualmente."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Password corrente</p>
              <div className="flex items-center gap-3">
                <p className="text-xl font-mono font-bold text-nero tracking-wider">
                  {pwInfo.passwordCorrente}
                </p>
                <button
                  onClick={copiaPassword}
                  className="px-3 py-1 text-xs font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors cursor-pointer"
                >
                  {copiata ? "Copiata" : "Copia"}
                </button>
              </div>
            </div>

            {pwInfo.modalita === "automatica" && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Prossimo cambio</p>
                <p className="text-lg font-semibold text-nero">
                  {formatDataItaliana(pwInfo.prossimoCambio)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Prossima: <span className="font-mono font-medium text-gray-600">{pwInfo.prossimaPassword}</span>
                </p>
              </div>
            )}
          </div>

          {/* Form password manuale */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-nero mb-2">Imposta password manuale</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={pwManuale}
                onChange={(e) => setPwManuale(e.target.value)}
                placeholder="Nuova password (min. 4 caratteri)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-primario focus:border-transparent"
              />
              <button
                onClick={impostaPasswordManuale}
                disabled={pwSalvataggio || pwManuale.trim().length < 4}
                className="px-4 py-2 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                Imposta
              </button>
            </div>
            {pwInfo.modalita === "manuale" && (
              <button
                onClick={tornaAutomatica}
                disabled={pwSalvataggio}
                className="mt-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Torna alla password automatica
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ricalcola Prezzi */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-nero mb-2">
          Aggiornamento Prezzi — {"Basic"}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Scarica i prezzi live da Yahoo Finance e ricalcola valori, P&L e pesi di tutti i titoli, categorie e portafoglio.
        </p>
        {stats && (
          <p className="text-sm text-gray-500 mb-4">
            Ultimo aggiornamento: <span className="font-medium">{stats.dataAggiornamento}</span>
          </p>
        )}
        <button
          onClick={ricalcolaPrezzi}
          disabled={ricalcolo}
          className="px-6 py-2.5 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          {ricalcolo ? "Ricalcolo in corso..." : "Ricalcola Prezzi"}
        </button>

        {risultato && (
          <p className="mt-4 text-sm text-verde-guadagno font-medium">{risultato}</p>
        )}
        {errore && (
          <p className="mt-4 text-sm text-rosso-perdita">{errore}</p>
        )}
      </div>

      {/* Link rapidi */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-nero mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/admin/titoli/nuovo"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors"
          >
            Aggiungi Titolo
          </Link>
          <Link
            href="/admin/transazioni/nuova"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-verde-scuro rounded-lg hover:bg-verde-scuro/90 transition-colors"
          >
            Nuova Transazione
          </Link>
          <Link
            href={`/${portfolio}/dashboard`}
            className="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Vai alla Dashboard ({"Basic"})
          </Link>
        </div>
      </div>
    </div>
  );
}
