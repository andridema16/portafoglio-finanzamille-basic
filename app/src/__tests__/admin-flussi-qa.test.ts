/**
 * QA tests — Flussi di Capitale admin feature
 *
 * Covers:
 *   1. GET  /api/admin/flussi      — returns flussi array
 *   2. POST /api/admin/flussi      — validates fields, rejects bad tipo, creates flusso
 *   3. DELETE /api/admin/flussi/[id] — 404 for missing, 400 for inizio, 200 for deposito/prelievo
 *   4. badgeTipo / labelTipo helpers (extracted and tested in isolation)
 *   5. Auth guard — 403 when x-user-role != admin
 *
 * Strategy: mock next/headers and @lib/db so tests run without a database or
 * Next.js server.  The neon dynamic import inside the POST route is mocked via
 * vi.mock("@neondatabase/serverless").
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FlussoCapitale } from "@/types/portafoglio";

// ─── Shared mock state ────────────────────────────────────────────────────────

let mockRole: string | null = "admin";
let mockFlussi: FlussoCapitale[] = [];
let addFlussoCalledWith: Omit<FlussoCapitale, "id"> | null = null;
let deletedId: number | null = null;
let neonSqlCalled = false;

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) => {
      if (name === "x-user-role") return mockRole;
      return null;
    },
  })),
}));

vi.mock("@/lib/db", () => ({
  getFlussiCapitale: vi.fn(async () => mockFlussi),
  addFlussoCapitale: vi.fn(async (f: Omit<FlussoCapitale, "id">) => {
    addFlussoCalledWith = f;
  }),
  deleteFlussoCapitale: vi.fn(async (id: number) => {
    deletedId = id;
  }),
}));

// Intercept the dynamic import("@neondatabase/serverless") used in POST route
vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => {
    // Return a tagged-template-literal-compatible function
    const sql = vi.fn(async () => []) as unknown as ReturnType<typeof import("@neondatabase/serverless").neon>;
    neonSqlCalled = true;
    return sql;
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFlusso(overrides: Partial<FlussoCapitale> = {}): FlussoCapitale {
  return {
    id: 1,
    data: "2026-01-02",
    tipo: "deposito",
    importo: 5000,
    valorePre: 30000,
    capitalePost: 35000,
    nota: "",
    ...overrides,
  };
}

/** Build a minimal Request object with a JSON body */
function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/admin/flussi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Build a minimal Request object with malformed body */
function makeInvalidRequest(): Request {
  return new Request("http://localhost/api/admin/flussi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/admin/flussi
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/admin/flussi", () => {
  beforeEach(() => {
    mockRole = "admin";
    mockFlussi = [];
  });

  it("returns 403 when user role is not admin", async () => {
    mockRole = "user";
    const { GET } = await import("@/app/api/admin/flussi/route");
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 403 when x-user-role header is missing", async () => {
    mockRole = null;
    const { GET } = await import("@/app/api/admin/flussi/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 200 with an empty array when no flussi exist", async () => {
    mockFlussi = [];
    const { GET } = await import("@/app/api/admin/flussi/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  it("returns 200 with the full flussi array", async () => {
    mockFlussi = [
      makeFlusso({ id: 1, tipo: "inizio" }),
      makeFlusso({ id: 2, tipo: "deposito" }),
    ];
    const { GET } = await import("@/app/api/admin/flussi/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].tipo).toBe("inizio");
    expect(body[1].tipo).toBe("deposito");
  });

  it("response is JSON (Content-Type includes application/json)", async () => {
    const { GET } = await import("@/app/api/admin/flussi/route");
    const res = await GET();
    expect(res.headers.get("content-type")).toContain("application/json");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /api/admin/flussi
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/admin/flussi", () => {
  beforeEach(() => {
    mockRole = "admin";
    mockFlussi = [makeFlusso({ id: 1, data: "2026-01-02", tipo: "inizio" })];
    addFlussoCalledWith = null;
    neonSqlCalled = false;
  });

  it("returns 403 when user role is not admin", async () => {
    mockRole = "user";
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeRequest({ data: "2026-02-01", tipo: "deposito", importo: 1000, valorePre: 30000, capitalePost: 31000 }));
    expect(res.status).toBe(403);
  });

  it("returns 400 when body is malformed JSON", async () => {
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeInvalidRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Richiesta non valida");
  });

  it("returns 400 when 'data' field is missing", async () => {
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeRequest({ tipo: "deposito", importo: 1000, valorePre: 30000, capitalePost: 31000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Campi obbligatori mancanti");
  });

  it("returns 400 when 'tipo' field is missing", async () => {
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeRequest({ data: "2026-02-01", importo: 1000, valorePre: 30000, capitalePost: 31000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Campi obbligatori mancanti");
  });

  it("returns 400 when 'importo' is null", async () => {
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeRequest({ data: "2026-02-01", tipo: "deposito", importo: null, valorePre: 30000, capitalePost: 31000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Campi obbligatori mancanti");
  });

  it("returns 400 when 'valorePre' is missing", async () => {
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeRequest({ data: "2026-02-01", tipo: "deposito", importo: 1000, capitalePost: 31000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Campi obbligatori mancanti");
  });

  it("returns 400 when 'capitalePost' is missing", async () => {
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeRequest({ data: "2026-02-01", tipo: "deposito", importo: 1000, valorePre: 30000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Campi obbligatori mancanti");
  });

  it("returns 400 when tipo is 'inizio' (not allowed via POST)", async () => {
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeRequest({ data: "2026-02-01", tipo: "inizio", importo: 1000, valorePre: 30000, capitalePost: 31000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Tipo non valido (deposito o prelievo)");
  });

  it("returns 400 when tipo is an arbitrary invalid string", async () => {
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeRequest({ data: "2026-02-01", tipo: "trasferimento", importo: 1000, valorePre: 30000, capitalePost: 31000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Tipo non valido (deposito o prelievo)");
  });

  it("returns 400 when tipo is empty string (treated as missing by falsy guard)", async () => {
    // The route uses `!tipo` which is true for "" — so the missing-fields guard
    // fires first, returning "Campi obbligatori mancanti" rather than "Tipo non valido".
    // This is correct: an empty tipo is treated the same as an absent tipo.
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeRequest({ data: "2026-02-01", tipo: "", importo: 1000, valorePre: 30000, capitalePost: 31000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Campi obbligatori mancanti");
  });

  it("creates a deposito flusso and returns 201", async () => {
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeRequest({
      data: "2026-02-01",
      tipo: "deposito",
      importo: 5000,
      valorePre: 30000,
      capitalePost: 35000,
      nota: "Secondo versamento",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tipo).toBe("deposito");
    expect(body.importo).toBe(5000);
    expect(body.capitalePost).toBe(35000);
    expect(body.nota).toBe("Secondo versamento");
  });

  it("creates a prelievo flusso and returns 201", async () => {
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeRequest({
      data: "2026-02-15",
      tipo: "prelievo",
      importo: 2000,
      valorePre: 35000,
      capitalePost: 33000,
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tipo).toBe("prelievo");
    expect(body.importo).toBe(2000);
  });

  it("calls addFlussoCapitale with numeric values (coerces string numbers)", async () => {
    const { POST } = await import("@/app/api/admin/flussi/route");
    await POST(makeRequest({
      data: "2026-03-01",
      tipo: "deposito",
      importo: "1234.56",
      valorePre: "30000",
      capitalePost: "31234.56",
    }));
    expect(addFlussoCalledWith).not.toBeNull();
    expect(addFlussoCalledWith!.importo).toBe(1234.56);
    expect(addFlussoCalledWith!.valorePre).toBe(30000);
    expect(addFlussoCalledWith!.capitalePost).toBe(31234.56);
  });

  it("defaults nota to empty string when nota is not provided", async () => {
    const { POST } = await import("@/app/api/admin/flussi/route");
    await POST(makeRequest({
      data: "2026-03-10",
      tipo: "deposito",
      importo: 1000,
      valorePre: 30000,
      capitalePost: 31000,
    }));
    // nota absent from body → route does: nota: (nota as string) ?? "" → ""
    expect(addFlussoCalledWith).not.toBeNull();
    expect(addFlussoCalledWith!.nota).toBe("");
  });

  it("importo of zero (0) is accepted (not treated as missing)", async () => {
    // The guard is `importo == null`; 0 passes (0 == null is false)
    const { POST } = await import("@/app/api/admin/flussi/route");
    const res = await POST(makeRequest({
      data: "2026-03-20",
      tipo: "deposito",
      importo: 0,
      valorePre: 30000,
      capitalePost: 30000,
    }));
    expect(res.status).toBe(201);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. DELETE /api/admin/flussi/[id]
// ─────────────────────────────────────────────────────────────────────────────

describe("DELETE /api/admin/flussi/[id]", () => {
  beforeEach(() => {
    mockRole = "admin";
    mockFlussi = [
      makeFlusso({ id: 1, tipo: "inizio" }),
      makeFlusso({ id: 2, tipo: "deposito" }),
      makeFlusso({ id: 3, tipo: "prelievo" }),
    ];
    deletedId = null;
  });

  /** Build the params Promise as expected by Next.js App Router */
  function makeParams(id: string) {
    return { params: Promise.resolve({ id }) };
  }

  it("returns 403 when user is not admin", async () => {
    mockRole = "user";
    const { DELETE } = await import("@/app/api/admin/flussi/[id]/route");
    const req = new Request("http://localhost/api/admin/flussi/2", { method: "DELETE" });
    const res = await DELETE(req, makeParams("2"));
    expect(res.status).toBe(403);
  });

  it("returns 403 when x-user-role header is missing", async () => {
    mockRole = null;
    const { DELETE } = await import("@/app/api/admin/flussi/[id]/route");
    const req = new Request("http://localhost/api/admin/flussi/2", { method: "DELETE" });
    const res = await DELETE(req, makeParams("2"));
    expect(res.status).toBe(403);
  });

  it("returns 404 when flusso id does not exist", async () => {
    const { DELETE } = await import("@/app/api/admin/flussi/[id]/route");
    const req = new Request("http://localhost/api/admin/flussi/999", { method: "DELETE" });
    const res = await DELETE(req, makeParams("999"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Flusso non trovato");
  });

  it("returns 400 and blocks deletion of tipo='inizio'", async () => {
    const { DELETE } = await import("@/app/api/admin/flussi/[id]/route");
    const req = new Request("http://localhost/api/admin/flussi/1", { method: "DELETE" });
    const res = await DELETE(req, makeParams("1"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Non è possibile eliminare il flusso iniziale");
  });

  it("does NOT call deleteFlussoCapitale when tipo is 'inizio'", async () => {
    const { DELETE } = await import("@/app/api/admin/flussi/[id]/route");
    const req = new Request("http://localhost/api/admin/flussi/1", { method: "DELETE" });
    await DELETE(req, makeParams("1"));
    expect(deletedId).toBeNull();
  });

  it("returns 200 success when deleting a deposito flusso", async () => {
    const { DELETE } = await import("@/app/api/admin/flussi/[id]/route");
    const req = new Request("http://localhost/api/admin/flussi/2", { method: "DELETE" });
    const res = await DELETE(req, makeParams("2"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("calls deleteFlussoCapitale with the correct numeric id for deposito", async () => {
    const { DELETE } = await import("@/app/api/admin/flussi/[id]/route");
    const req = new Request("http://localhost/api/admin/flussi/2", { method: "DELETE" });
    await DELETE(req, makeParams("2"));
    expect(deletedId).toBe(2);
  });

  it("returns 200 success when deleting a prelievo flusso", async () => {
    const { DELETE } = await import("@/app/api/admin/flussi/[id]/route");
    const req = new Request("http://localhost/api/admin/flussi/3", { method: "DELETE" });
    const res = await DELETE(req, makeParams("3"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("calls deleteFlussoCapitale with the correct numeric id for prelievo", async () => {
    const { DELETE } = await import("@/app/api/admin/flussi/[id]/route");
    const req = new Request("http://localhost/api/admin/flussi/3", { method: "DELETE" });
    await DELETE(req, makeParams("3"));
    expect(deletedId).toBe(3);
  });

  it("id is coerced from string to number (string '2' becomes numeric 2)", async () => {
    const { DELETE } = await import("@/app/api/admin/flussi/[id]/route");
    const req = new Request("http://localhost/api/admin/flussi/2", { method: "DELETE" });
    await DELETE(req, makeParams("2"));
    // deletedId must be a number, not string "2"
    expect(typeof deletedId).toBe("number");
    expect(deletedId).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. badgeTipo and labelTipo pure helpers (tested via inline copies)
//    These are private functions in the page component, so we copy the
//    exact same logic here rather than importing the client component (which
//    would require a DOM/jsdom environment).
// ─────────────────────────────────────────────────────────────────────────────

describe("badgeTipo helper", () => {
  function badgeTipo(tipo: FlussoCapitale["tipo"]): string {
    if (tipo === "deposito") return "bg-green-50 text-verde-guadagno";
    if (tipo === "prelievo") return "bg-red-50 text-rosso-perdita";
    return "bg-gray-100 text-gray-600";
  }

  it("deposito → green badge classes", () => {
    expect(badgeTipo("deposito")).toBe("bg-green-50 text-verde-guadagno");
  });

  it("prelievo → red badge classes", () => {
    expect(badgeTipo("prelievo")).toBe("bg-red-50 text-rosso-perdita");
  });

  it("inizio → gray badge classes", () => {
    expect(badgeTipo("inizio")).toBe("bg-gray-100 text-gray-600");
  });
});

describe("labelTipo helper", () => {
  function labelTipo(tipo: FlussoCapitale["tipo"]): string {
    if (tipo === "deposito") return "Deposito";
    if (tipo === "prelievo") return "Prelievo";
    return "Inizio";
  }

  it("deposito → 'Deposito'", () => {
    expect(labelTipo("deposito")).toBe("Deposito");
  });

  it("prelievo → 'Prelievo'", () => {
    expect(labelTipo("prelievo")).toBe("Prelievo");
  });

  it("inizio → 'Inizio'", () => {
    expect(labelTipo("inizio")).toBe("Inizio");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Delete-button visibility logic
//    The page renders a delete button only when f.tipo !== 'inizio'.
//    We test the boolean predicate directly.
// ─────────────────────────────────────────────────────────────────────────────

describe("delete button visibility (f.tipo !== 'inizio')", () => {
  function shouldShowDeleteButton(tipo: FlussoCapitale["tipo"]): boolean {
    return tipo !== "inizio";
  }

  it("shows delete button for deposito", () => {
    expect(shouldShowDeleteButton("deposito")).toBe(true);
  });

  it("shows delete button for prelievo", () => {
    expect(shouldShowDeleteButton("prelievo")).toBe(true);
  });

  it("does NOT show delete button for inizio", () => {
    expect(shouldShowDeleteButton("inizio")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. formatData helper (used in the page table)
// ─────────────────────────────────────────────────────────────────────────────

describe("formatData (from @/lib/format)", () => {
  it("formats ISO date to DD/MM/YYYY", async () => {
    const { formatData } = await import("@/lib/format");
    expect(formatData("2026-01-02")).toBe("02/01/2026");
  });

  it("formats end-of-year date correctly", async () => {
    const { formatData } = await import("@/lib/format");
    expect(formatData("2026-12-31")).toBe("31/12/2026");
  });

  it("preserves leading zeros for single-digit day/month", async () => {
    const { formatData } = await import("@/lib/format");
    expect(formatData("2026-03-05")).toBe("05/03/2026");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. formatValutaDecimali helper (used in the page table)
// ─────────────────────────────────────────────────────────────────────────────

describe("formatValutaDecimali (from @/lib/format)", () => {
  it("formats a whole number with 2 decimal places", async () => {
    const { formatValutaDecimali } = await import("@/lib/format");
    expect(formatValutaDecimali(5000)).toBe("$5,000.00");
  });

  it("formats a decimal amount correctly", async () => {
    const { formatValutaDecimali } = await import("@/lib/format");
    expect(formatValutaDecimali(1234.56)).toBe("$1,234.56");
  });

  it("formats zero as $0.00", async () => {
    const { formatValutaDecimali } = await import("@/lib/format");
    expect(formatValutaDecimali(0)).toBe("$0.00");
  });

  it("formats negative value with minus sign", async () => {
    const { formatValutaDecimali } = await import("@/lib/format");
    const result = formatValutaDecimali(-500);
    expect(result).toContain("500.00");
    expect(result).toContain("-");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. POST — portafoglio update side-effect
//    When the new flusso date >= last existing flusso date, neon is called
//    to update portafoglio.investimento_iniziale.
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/admin/flussi — portafoglio update side-effect", () => {
  beforeEach(() => {
    mockRole = "admin";
    neonSqlCalled = false;
    addFlussoCalledWith = null;
  });

  it("calls neon SQL update when new flusso is the most recent (date is later)", async () => {
    // mockFlussi simulates what getFlussiCapitale returns AFTER add (second call in route)
    mockFlussi = [
      makeFlusso({ id: 1, data: "2026-01-02", tipo: "inizio" }),
      makeFlusso({ id: 2, data: "2026-03-01", tipo: "deposito" }),
    ];
    const { POST } = await import("@/app/api/admin/flussi/route");
    // new flusso date "2026-04-01" >= last flusso date "2026-03-01"
    await POST(makeRequest({
      data: "2026-04-01",
      tipo: "deposito",
      importo: 1000,
      valorePre: 30000,
      capitalePost: 31000,
    }));
    // neon was called for the UPDATE portafoglio query
    expect(neonSqlCalled).toBe(true);
  });

  it("calls neon SQL update when new flusso date equals last existing date", async () => {
    mockFlussi = [
      makeFlusso({ id: 1, data: "2026-03-01", tipo: "inizio" }),
    ];
    neonSqlCalled = false;
    const { POST } = await import("@/app/api/admin/flussi/route");
    await POST(makeRequest({
      data: "2026-03-01",
      tipo: "deposito",
      importo: 1000,
      valorePre: 30000,
      capitalePost: 31000,
    }));
    expect(neonSqlCalled).toBe(true);
  });
});
