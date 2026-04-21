"use client";

interface Props {
  aperto: boolean;
  titolo: string;
  messaggio: string;
  onConferma: () => void;
  onAnnulla: () => void;
  caricamento?: boolean;
}

export default function ConfermaEliminazione({
  aperto,
  titolo,
  messaggio,
  onConferma,
  onAnnulla,
  caricamento = false,
}: Props) {
  if (!aperto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onAnnulla} />
      <div className="relative bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-nero mb-2">{titolo}</h3>
        <p className="text-sm text-gray-600 mb-6">{messaggio}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onAnnulla}
            disabled={caricamento}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={onConferma}
            disabled={caricamento}
            className="px-4 py-2 text-sm font-medium text-white bg-rosso-perdita rounded-lg hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            {caricamento ? "Eliminazione..." : "Elimina"}
          </button>
        </div>
      </div>
    </div>
  );
}
