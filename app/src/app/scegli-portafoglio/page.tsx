import Link from "next/link";

export const metadata = {
  title: "Scegli Portafoglio | FinanzaMille",
};

export default function ScegliPortafoglioPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-grigio-sfondo min-h-screen">
      <div className="w-full max-w-3xl mx-auto px-6">
        {/* Header con logo */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-nero">Finanz</span>
            <span className="text-verde-primario">Amille</span>
          </h1>
          <p className="text-nero/60 text-lg font-medium mt-2 tracking-wide">
            Scegli il tuo portafoglio
          </p>
        </div>

        {/* Card portafogli */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Portafoglio Basic — attivo */}
          <Link
            href="/basic/dashboard"
            className="block bg-white rounded-xl shadow-sm p-6 border-2 border-verde-primario hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-nero">
                Portafoglio Basic
              </h2>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-verde-primario/10 text-verde-guadagno">
                Attivo
              </span>
            </div>
            <p className="text-sm text-nero/60 leading-relaxed">
              Portafoglio conservativo per chi inizia a investire.
            </p>
          </Link>

          {/* Watchlist */}
          <Link
            href="/watchlist"
            className="block bg-white rounded-xl shadow-sm p-6 border-2 border-verde-primario hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-nero">
                Watchlist
              </h2>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-verde-primario/10 text-verde-guadagno">
                Attivo
              </span>
            </div>
            <p className="text-sm text-nero/60 leading-relaxed">
              Titoli sotto osservazione con analisi e target price.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
