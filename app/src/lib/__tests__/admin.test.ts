/**
 * Tests for the admin panel layer:
 *
 * 1. verificaAdmin() in src/lib/admin.ts
 *    - returns null when x-user-role is "admin"
 *    - returns 403 NextResponse for any non-admin role (user, empty, missing)
 *
 * 2. API route logic — input validation (missing fields → 400)
 *    These tests call the route handlers directly after mocking out:
 *      - next/headers (to control x-user-role)
 *      - @neondatabase/serverless (no real DB)
 *    All DB-touching functions are mocked to no-ops or stubs.
 *
 * 3. DB function exports — new functions added for admin use
 *    getDividendiConId, getOperazioniConId, updateDividendo, updateOperazione,
 *    addStorico, getTitoloByTicker, getCategoriaById
 *    Tested as export-shape and row-mapper unit tests (no real DB call).
 *
 * Isolation strategy:
 *   vi.mock() hoisting handles next/headers and @neondatabase/serverless.
 *   Each section resets the relevant mocks in beforeEach.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ─── Global mocks (hoisted) ───────────────────────────────────────────────────

// Mock next/headers so we can control the x-user-role header per-test.
const mockHeadersGet = vi.fn();

vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: mockHeadersGet,
  })),
}));

// Mock @neondatabase/serverless so no real DB is hit.
// The mock sql tag function returns [] by default; tests can override via
// mockSql.mockResolvedValueOnce([...]) on the mock returned by neon().
const mockSqlFn = vi.fn().mockResolvedValue([]);

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => mockSqlFn),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 1. verificaAdmin()
// ─────────────────────────────────────────────────────────────────────────────

describe("verificaAdmin()", () => {
  beforeEach(() => {
    mockHeadersGet.mockReset();
  });

  it("returns null when x-user-role is 'admin'", async () => {
    mockHeadersGet.mockReturnValue("admin");
    const { verificaAdmin } = await import("@/lib/admin");
    const result = await verificaAdmin();
    expect(result).toBeNull();
  });

  it("returns a NextResponse with status 403 when role is 'user'", async () => {
    mockHeadersGet.mockReturnValue("user");
    const { verificaAdmin } = await import("@/lib/admin");
    const result = await verificaAdmin();
    expect(result).toBeInstanceOf(NextResponse);
    expect(result!.status).toBe(403);
  });

  it("returns 403 when role is an empty string", async () => {
    mockHeadersGet.mockReturnValue("");
    const { verificaAdmin } = await import("@/lib/admin");
    const result = await verificaAdmin();
    expect(result).toBeInstanceOf(NextResponse);
    expect(result!.status).toBe(403);
  });

  it("returns 403 when x-user-role header is missing (null)", async () => {
    mockHeadersGet.mockReturnValue(null);
    const { verificaAdmin } = await import("@/lib/admin");
    const result = await verificaAdmin();
    expect(result).toBeInstanceOf(NextResponse);
    expect(result!.status).toBe(403);
  });

  it("returns 403 when role is 'ADMIN' (case-sensitive check)", async () => {
    mockHeadersGet.mockReturnValue("ADMIN");
    const { verificaAdmin } = await import("@/lib/admin");
    const result = await verificaAdmin();
    expect(result).toBeInstanceOf(NextResponse);
    expect(result!.status).toBe(403);
  });

  it("403 response body contains { error: 'Accesso negato' }", async () => {
    mockHeadersGet.mockReturnValue("user");
    const { verificaAdmin } = await import("@/lib/admin");
    const result = await verificaAdmin();
    const body = await result!.json();
    expect(body).toEqual({ error: "Accesso negato" });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. API route validation logic
//
// Instead of instantiating the full Next.js App Router machinery, we test the
// request-body validation logic as a self-contained unit: we replicate the exact
// conditions each route handler checks (missing required fields) and verify the
// 400 response path. We do this by directly calling the exported handler
// functions with crafted Request objects.
// ─────────────────────────────────────────────────────────────────────────────

// Helper: build a Request with a JSON body
function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Helper: build a Request with a non-JSON body (for parse-error tests)
function makeInvalidRequest(): Request {
  return new Request("http://localhost/api/admin/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "NOT_JSON{{{",
  });
}

// Helper: set the role header mock to "admin" for all route tests
function setAdminRole() {
  mockHeadersGet.mockReturnValue("admin");
}

// ── 2a. titoli POST ──────────────────────────────────────────────────────────

describe("API /admin/titoli POST — validation", () => {
  beforeEach(() => {
    mockHeadersGet.mockReset();
    mockSqlFn.mockReset();
    mockSqlFn.mockResolvedValue([]);
    setAdminRole();
  });

  it("returns 400 when body is not valid JSON", async () => {
    const { POST } = await import("@/app/api/admin/titoli/route");
    const res = await POST(makeInvalidRequest());
    expect(res.status).toBe(400);
  });

  it("returns 400 when ticker is missing", async () => {
    const { POST } = await import("@/app/api/admin/titoli/route");
    const res = await POST(makeRequest({
      nome: "Test Inc", categoria: "commodities",
      numAzioni: 1, prezzoMedioCarico: 100, assetClass: "azione", paese: "USA", settore: "energia",
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 400 when nome is missing", async () => {
    const { POST } = await import("@/app/api/admin/titoli/route");
    const res = await POST(makeRequest({
      ticker: "EOG", categoria: "commodities",
      numAzioni: 1, prezzoMedioCarico: 100, assetClass: "azione", paese: "USA", settore: "energia",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when categoria is missing", async () => {
    const { POST } = await import("@/app/api/admin/titoli/route");
    const res = await POST(makeRequest({
      ticker: "EOG", nome: "EOG Resources",
      numAzioni: 1, prezzoMedioCarico: 100, assetClass: "azione", paese: "USA", settore: "energia",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when numAzioni is missing", async () => {
    const { POST } = await import("@/app/api/admin/titoli/route");
    const res = await POST(makeRequest({
      ticker: "EOG", nome: "EOG Resources", categoria: "commodities",
      prezzoMedioCarico: 100, assetClass: "azione", paese: "USA", settore: "energia",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when prezzoMedioCarico is missing", async () => {
    const { POST } = await import("@/app/api/admin/titoli/route");
    const res = await POST(makeRequest({
      ticker: "EOG", nome: "EOG Resources", categoria: "commodities",
      numAzioni: 2, assetClass: "azione", paese: "USA", settore: "energia",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when assetClass is missing", async () => {
    const { POST } = await import("@/app/api/admin/titoli/route");
    const res = await POST(makeRequest({
      ticker: "EOG", nome: "EOG Resources", categoria: "commodities",
      numAzioni: 1, prezzoMedioCarico: 100, paese: "USA", settore: "energia",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when paese is missing", async () => {
    const { POST } = await import("@/app/api/admin/titoli/route");
    const res = await POST(makeRequest({
      ticker: "EOG", nome: "EOG Resources", categoria: "commodities",
      numAzioni: 1, prezzoMedioCarico: 100, assetClass: "azione", settore: "energia",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when settore is missing", async () => {
    const { POST } = await import("@/app/api/admin/titoli/route");
    const res = await POST(makeRequest({
      ticker: "EOG", nome: "EOG Resources", categoria: "commodities",
      numAzioni: 1, prezzoMedioCarico: 100, assetClass: "azione", paese: "USA",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 201 with correct costo when all required fields are present", async () => {
    const { POST } = await import("@/app/api/admin/titoli/route");
    const res = await POST(makeRequest({
      ticker: "EOG", nome: "EOG Resources", categoria: "commodities",
      numAzioni: 2.5, prezzoMedioCarico: 100,
      assetClass: "azione", paese: "USA", settore: "energia",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ticker).toBe("EOG");
    expect(body.costo).toBe(250); // 2.5 * 100
    expect(body.valoreAttuale).toBe(250);
    expect(body.pesoPercentuale).toBe(0);
  });

  it("sets optional dividendi to 0 when not provided", async () => {
    const { POST } = await import("@/app/api/admin/titoli/route");
    const res = await POST(makeRequest({
      ticker: "EOG", nome: "EOG Resources", categoria: "commodities",
      numAzioni: 1, prezzoMedioCarico: 100, assetClass: "azione", paese: "USA", settore: "energia",
    }));
    const body = await res.json();
    expect(body.dividendi).toBe(0);
  });

  it("sets optional peRatio to null when not provided", async () => {
    const { POST } = await import("@/app/api/admin/titoli/route");
    const res = await POST(makeRequest({
      ticker: "EOG", nome: "EOG Resources", categoria: "commodities",
      numAzioni: 1, prezzoMedioCarico: 100, assetClass: "azione", paese: "USA", settore: "energia",
    }));
    const body = await res.json();
    expect(body.peRatio).toBeNull();
  });
});

// ── 2b. categorie POST ───────────────────────────────────────────────────────

describe("API /admin/categorie POST — validation", () => {
  beforeEach(() => {
    mockHeadersGet.mockReset();
    mockSqlFn.mockReset();
    mockSqlFn.mockResolvedValue([]);
    setAdminRole();
  });

  it("returns 400 when body is not valid JSON", async () => {
    const { POST } = await import("@/app/api/admin/categorie/route");
    const res = await POST(makeInvalidRequest());
    expect(res.status).toBe(400);
  });

  it("returns 400 when id is missing", async () => {
    const { POST } = await import("@/app/api/admin/categorie/route");
    const res = await POST(makeRequest({ nome: "Commodities", slug: "commodities" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/id/i);
  });

  it("returns 400 when nome is missing", async () => {
    const { POST } = await import("@/app/api/admin/categorie/route");
    const res = await POST(makeRequest({ id: "cat-1", slug: "commodities" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when slug is missing", async () => {
    const { POST } = await import("@/app/api/admin/categorie/route");
    const res = await POST(makeRequest({ id: "cat-1", nome: "Commodities" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 with defaults when optional fields are absent", async () => {
    const { POST } = await import("@/app/api/admin/categorie/route");
    const res = await POST(makeRequest({ id: "cat-1", nome: "Commodities", slug: "commodities" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.pesoPercentuale).toBe(0);
    expect(body.costo).toBe(0);
    expect(body.valoreAttuale).toBe(0);
    expect(body.profittoOPerdita).toBe(0);
    expect(body.plPercentuale).toBe(0);
    expect(body.dividendi).toBe(0);
  });

  it("returns 201 with correct data when all fields provided", async () => {
    const { POST } = await import("@/app/api/admin/categorie/route");
    const res = await POST(makeRequest({
      id: "cat-99", nome: "Test", slug: "test",
      pesoPercentuale: 10, costo: 500, valoreAttuale: 600,
      profittoOPerdita: 100, plPercentuale: 20, dividendi: 5,
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("cat-99");
    expect(body.pesoPercentuale).toBe(10);
  });
});

// ── 2c. transazioni POST ─────────────────────────────────────────────────────

describe("API /admin/transazioni POST — validation", () => {
  beforeEach(() => {
    mockHeadersGet.mockReset();
    mockSqlFn.mockReset();
    mockSqlFn.mockResolvedValue([]);
    setAdminRole();
  });

  it("returns 400 when body is not valid JSON", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeInvalidRequest());
    expect(res.status).toBe(400);
  });

  it("returns 400 when tipo is an unknown value", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({ tipo: "storno", data: "2026-01-01", ticker: "EOG", importo: 10 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/tipo/i);
  });

  // dividendo
  it("returns 400 for dividendo when data is missing", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({ tipo: "dividendo", ticker: "EOG", importo: 5 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for dividendo when ticker is missing", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({ tipo: "dividendo", data: "2026-01-01", importo: 5 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for dividendo when importo is missing", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({ tipo: "dividendo", data: "2026-01-01", ticker: "EOG" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 for a valid dividendo", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({
      tipo: "dividendo", data: "2026-01-15", ticker: "EOG",
      importo: 3.5, descrizione: "EOG dividend",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tipo).toBe("dividendo");
    expect(body.importo).toBe(3.5);
    expect(body.descrizione).toBe("EOG dividend");
  });

  it("defaults descrizione to '' when missing in dividendo", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({ tipo: "dividendo", data: "2026-01-15", ticker: "EOG", importo: 2 }));
    const body = await res.json();
    expect(body.descrizione).toBe("");
  });

  // vendita
  it("returns 400 for vendita when data is missing", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({
      tipo: "vendita", ticker: "VAL", nome: "Valaris", azioniVendute: 1, prezzoAcquisto: 50,
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for vendita when ticker is missing", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({
      tipo: "vendita", data: "2026-01-15", nome: "Valaris", azioniVendute: 1, prezzoAcquisto: 50,
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for vendita when nome is missing", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({
      tipo: "vendita", data: "2026-01-15", ticker: "VAL", azioniVendute: 1, prezzoAcquisto: 50,
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for vendita when azioniVendute is missing", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({
      tipo: "vendita", data: "2026-01-15", ticker: "VAL", nome: "Valaris", prezzoAcquisto: 50,
    }));
    expect(res.status).toBe(400);
  });

  it("returns 201 for a valid vendita", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({
      tipo: "vendita", data: "2026-01-15", ticker: "VAL", nome: "Valaris",
      azioniVendute: 1.5, prezzoAcquisto: 52, prezzoVendita: 78,
      utileRealizzato: 39, percentuale: 75, nota: "Good exit",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tipo).toBe("vendita");
    expect(body.azioniVendute).toBe(1.5);
    expect(body.prezzoVendita).toBe(78);
  });

  it("defaults optional vendita fields to 0 when missing", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({
      tipo: "vendita", data: "2026-01-15", ticker: "VAL", nome: "Valaris",
      azioniVendute: 1, prezzoAcquisto: 50,
    }));
    const body = await res.json();
    expect(body.prezzoVendita).toBe(0);
    expect(body.utileRealizzato).toBe(0);
    expect(body.percentuale).toBe(0);
    expect(body.nota).toBe("");
  });

  // acquisto
  it("returns 400 for acquisto when data is missing", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({
      tipo: "acquisto", ticker: "EOG", nome: "EOG Resources", azioniComprate: 2, prezzoAcquisto: 100,
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for acquisto when azioniComprate is missing", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({
      tipo: "acquisto", data: "2026-02-01", ticker: "EOG", nome: "EOG Resources", prezzoAcquisto: 100,
    }));
    expect(res.status).toBe(400);
  });

  it("returns 201 for a valid acquisto", async () => {
    const { POST } = await import("@/app/api/admin/transazioni/route");
    const res = await POST(makeRequest({
      tipo: "acquisto", data: "2026-02-01", ticker: "EOG", nome: "EOG Resources",
      azioniComprate: 2, prezzoAcquisto: 100, nota: "Entry",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tipo).toBe("acquisto");
    expect(body.azioniComprate).toBe(2);
  });
});

// ── 2d. transazioni/[id] PUT ─────────────────────────────────────────────────

describe("API /admin/transazioni/[id] PUT — validation", () => {
  beforeEach(() => {
    mockHeadersGet.mockReset();
    mockSqlFn.mockReset();
    mockSqlFn.mockResolvedValue([]);
    setAdminRole();
  });

  function makeParamsPromise(id: string): Promise<{ id: string }> {
    return Promise.resolve({ id });
  }

  it("returns 400 when body is not valid JSON", async () => {
    const { PUT } = await import("@/app/api/admin/transazioni/[id]/route");
    const res = await PUT(makeInvalidRequest(), { params: makeParamsPromise("1") });
    expect(res.status).toBe(400);
  });

  it("returns 400 when tabella field is missing", async () => {
    const { PUT } = await import("@/app/api/admin/transazioni/[id]/route");
    const req = makeRequest({ importo: 5 }); // no tabella
    const res = await PUT(req, { params: makeParamsPromise("1") });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/tabella/i);
  });

  it("returns 400 when tabella is an invalid value", async () => {
    const { PUT } = await import("@/app/api/admin/transazioni/[id]/route");
    const req = makeRequest({ tabella: "unknown" });
    const res = await PUT(req, { params: makeParamsPromise("1") });
    expect(res.status).toBe(400);
  });

  it("returns 200 success when tabella is 'dividendi'", async () => {
    // updateDividendo will call sql (mockSqlFn) twice: SELECT then UPDATE
    mockSqlFn
      .mockResolvedValueOnce([{
        id: 1, data: "2026-01-15", tipo: "dividendo",
        descrizione: "old", ticker: "EOG", importo: "3.5",
      }])
      .mockResolvedValueOnce([]); // UPDATE

    const { PUT } = await import("@/app/api/admin/transazioni/[id]/route");
    const req = makeRequest({ tabella: "dividendi", importo: 5 });
    const res = await PUT(req, { params: makeParamsPromise("1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 200 success when tabella is 'operazioni'", async () => {
    mockSqlFn
      .mockResolvedValueOnce([{
        id: 2, data: "2026-01-15", tipo: "vendita",
        ticker: "VAL", nome: "Valaris",
        azioni_vendute: "1.5", prezzo_acquisto: "52",
        prezzo_vendita: "78", utile_realizzato: "39",
        percentuale: "75", nota: "Good exit",
      }])
      .mockResolvedValueOnce([]); // UPDATE

    const { PUT } = await import("@/app/api/admin/transazioni/[id]/route");
    const req = makeRequest({ tabella: "operazioni", nota: "Updated note" });
    const res = await PUT(req, { params: makeParamsPromise("2") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ── 2e. transazioni/[id] DELETE ──────────────────────────────────────────────

describe("API /admin/transazioni/[id] DELETE — validation", () => {
  beforeEach(() => {
    mockHeadersGet.mockReset();
    mockSqlFn.mockReset();
    mockSqlFn.mockResolvedValue([]);
    setAdminRole();
  });

  function makeDeleteRequest(url: string): Request {
    return new Request(url, { method: "DELETE" });
  }

  it("returns 400 when tabella query param is missing", async () => {
    const { DELETE } = await import("@/app/api/admin/transazioni/[id]/route");
    const req = makeDeleteRequest("http://localhost/api/admin/transazioni/1");
    const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/tabella/i);
  });

  it("returns 400 when tabella query param is invalid", async () => {
    const { DELETE } = await import("@/app/api/admin/transazioni/[id]/route");
    const req = makeDeleteRequest("http://localhost/api/admin/transazioni/1?tabella=invalid");
    const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 200 success when tabella=dividendi", async () => {
    const { DELETE } = await import("@/app/api/admin/transazioni/[id]/route");
    const req = makeDeleteRequest("http://localhost/api/admin/transazioni/1?tabella=dividendi");
    const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 200 success when tabella=operazioni", async () => {
    const { DELETE } = await import("@/app/api/admin/transazioni/[id]/route");
    const req = makeDeleteRequest("http://localhost/api/admin/transazioni/1?tabella=operazioni");
    const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ── 2f. titoli/[ticker] PUT & DELETE auth guard ──────────────────────────────

describe("API /admin/titoli/[ticker] — auth guard", () => {
  beforeEach(() => {
    mockHeadersGet.mockReset();
    mockSqlFn.mockReset();
    mockSqlFn.mockResolvedValue([]);
  });

  it("PUT returns 403 for non-admin role", async () => {
    mockHeadersGet.mockReturnValue("user");
    const { PUT } = await import("@/app/api/admin/titoli/[ticker]/route");
    const req = new Request("http://localhost/", { method: "PUT", body: JSON.stringify({ nome: "X" }), headers: { "Content-Type": "application/json" } });
    const res = await PUT(req, { params: Promise.resolve({ ticker: "EOG" }) });
    expect(res.status).toBe(403);
  });

  it("DELETE returns 403 for non-admin role", async () => {
    mockHeadersGet.mockReturnValue("user");
    const { DELETE } = await import("@/app/api/admin/titoli/[ticker]/route");
    const req = new Request("http://localhost/", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ ticker: "EOG" }) });
    expect(res.status).toBe(403);
  });

  it("PUT returns 404 when titolo does not exist", async () => {
    mockHeadersGet.mockReturnValue("admin");
    mockSqlFn.mockResolvedValue([]); // getTitoloByTicker returns []

    const { PUT } = await import("@/app/api/admin/titoli/[ticker]/route");
    const req = new Request("http://localhost/", {
      method: "PUT",
      body: JSON.stringify({ nome: "Updated" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req, { params: Promise.resolve({ ticker: "NONEXISTENT" }) });
    expect(res.status).toBe(404);
  });

  it("DELETE returns 200 success for admin", async () => {
    mockHeadersGet.mockReturnValue("admin");
    const { DELETE } = await import("@/app/api/admin/titoli/[ticker]/route");
    const req = new Request("http://localhost/", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ ticker: "EOG" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ── 2g. categorie/[id] PUT & DELETE ─────────────────────────────────────────

describe("API /admin/categorie/[id] — auth guard and 404", () => {
  beforeEach(() => {
    mockHeadersGet.mockReset();
    mockSqlFn.mockReset();
    mockSqlFn.mockResolvedValue([]);
  });

  it("PUT returns 403 for non-admin", async () => {
    mockHeadersGet.mockReturnValue("user");
    const { PUT } = await import("@/app/api/admin/categorie/[id]/route");
    const req = new Request("http://localhost/", { method: "PUT", body: JSON.stringify({}), headers: { "Content-Type": "application/json" } });
    const res = await PUT(req, { params: Promise.resolve({ id: "cat-1" }) });
    expect(res.status).toBe(403);
  });

  it("PUT returns 404 when categoria does not exist", async () => {
    mockHeadersGet.mockReturnValue("admin");
    mockSqlFn.mockResolvedValue([]); // getCategoriaById returns []

    const { PUT } = await import("@/app/api/admin/categorie/[id]/route");
    const req = new Request("http://localhost/", {
      method: "PUT",
      body: JSON.stringify({ nome: "Updated" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "nonexistent-id" }) });
    expect(res.status).toBe(404);
  });

  it("DELETE returns 200 for admin", async () => {
    mockHeadersGet.mockReturnValue("admin");
    const { DELETE } = await import("@/app/api/admin/categorie/[id]/route");
    const req = new Request("http://localhost/", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "cat-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("DELETE returns 403 for non-admin", async () => {
    mockHeadersGet.mockReturnValue("user");
    const { DELETE } = await import("@/app/api/admin/categorie/[id]/route");
    const req = new Request("http://localhost/", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "cat-1" }) });
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. DB function exports — new admin functions
// ─────────────────────────────────────────────────────────────────────────────

describe("DB new admin function exports", () => {
  it("exports getDividendiConId as a function", async () => {
    const { getDividendiConId } = await import("@/lib/db");
    expect(typeof getDividendiConId).toBe("function");
  });

  it("exports getOperazioniConId as a function", async () => {
    const { getOperazioniConId } = await import("@/lib/db");
    expect(typeof getOperazioniConId).toBe("function");
  });

  it("exports updateDividendo as a function", async () => {
    const { updateDividendo } = await import("@/lib/db");
    expect(typeof updateDividendo).toBe("function");
  });

  it("exports updateOperazione as a function", async () => {
    const { updateOperazione } = await import("@/lib/db");
    expect(typeof updateOperazione).toBe("function");
  });

  it("exports addStorico as a function", async () => {
    const { addStorico } = await import("@/lib/db");
    expect(typeof addStorico).toBe("function");
  });

  it("exports getTitoloByTicker as a function", async () => {
    const { getTitoloByTicker } = await import("@/lib/db");
    expect(typeof getTitoloByTicker).toBe("function");
  });

  it("exports getCategoriaById as a function", async () => {
    const { getCategoriaById } = await import("@/lib/db");
    expect(typeof getCategoriaById).toBe("function");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. DB row mapper unit tests — DividendoConId and OperazioneConId
//    We test the mapping logic inline (replicating the private rowTo* functions)
//    since those functions are not exported.
// ─────────────────────────────────────────────────────────────────────────────

describe("rowToDividendoConId mapper logic", () => {
  function rowToDividendoConId(r: Record<string, unknown>) {
    return {
      id: Number(r.id),
      data: String(r.data).slice(0, 10),
      tipo: "dividendo" as const,
      descrizione: r.descrizione as string,
      ticker: r.ticker as string,
      importo: Number(r.importo),
    };
  }

  it("maps id as a number", () => {
    const r = { id: "42", data: "2026-01-15", tipo: "dividendo", descrizione: "Div", ticker: "EOG", importo: "3.5" };
    expect(rowToDividendoConId(r).id).toBe(42);
  });

  it("maps importo as a number", () => {
    const r = { id: "1", data: "2026-01-15", tipo: "dividendo", descrizione: "Div", ticker: "EOG", importo: "7.25" };
    expect(rowToDividendoConId(r).importo).toBe(7.25);
  });

  it("always sets tipo to 'dividendo'", () => {
    const r = { id: "1", data: "2026-01-15", tipo: "anything", descrizione: "Div", ticker: "EOG", importo: "1" };
    expect(rowToDividendoConId(r).tipo).toBe("dividendo");
  });

  it("slices data to YYYY-MM-DD", () => {
    const r = { id: "1", data: "2026-01-15T12:00:00.000Z", tipo: "dividendo", descrizione: "", ticker: "EOG", importo: "1" };
    expect(rowToDividendoConId(r).data).toBe("2026-01-15");
  });
});

describe("rowToOperazioneConId mapper logic", () => {
  function rowToOperazioneConId(r: Record<string, unknown>) {
    return {
      id: Number(r.id),
      data: String(r.data).slice(0, 10),
      tipo: r.tipo as "vendita" | "acquisto",
      ticker: r.ticker as string,
      nome: r.nome as string,
      azioniVendute: r.azioni_vendute != null ? Number(r.azioni_vendute) : undefined,
      azioniComprate: r.azioni_comprate != null ? Number(r.azioni_comprate) : undefined,
      prezzoAcquisto: Number(r.prezzo_acquisto),
      prezzoVendita: r.prezzo_vendita != null ? Number(r.prezzo_vendita) : undefined,
      utileRealizzato: r.utile_realizzato != null ? Number(r.utile_realizzato) : undefined,
      percentuale: r.percentuale != null ? Number(r.percentuale) : undefined,
      nota: (r.nota as string) ?? "",
    };
  }

  it("maps a vendita row with all fields", () => {
    const r = {
      id: "5", data: "2026-01-15", tipo: "vendita",
      ticker: "VAL", nome: "Valaris",
      azioni_vendute: "1.5", prezzo_acquisto: "52",
      prezzo_vendita: "78", utile_realizzato: "39",
      percentuale: "75.0", nota: "exit",
      azioni_comprate: null,
    };
    const mapped = rowToOperazioneConId(r);
    expect(mapped.id).toBe(5);
    expect(mapped.tipo).toBe("vendita");
    expect(mapped.azioniVendute).toBe(1.5);
    expect(mapped.prezzoVendita).toBe(78);
    expect(mapped.utileRealizzato).toBe(39);
    expect(mapped.percentuale).toBe(75);
    expect(mapped.azioniComprate).toBeUndefined();
  });

  it("maps an acquisto row correctly", () => {
    const r = {
      id: "6", data: "2026-02-01", tipo: "acquisto",
      ticker: "EOG", nome: "EOG Resources",
      azioni_comprate: "2.5", prezzo_acquisto: "115",
      nota: "entry",
      azioni_vendute: null, prezzo_vendita: null,
      utile_realizzato: null, percentuale: null,
    };
    const mapped = rowToOperazioneConId(r);
    expect(mapped.tipo).toBe("acquisto");
    expect(mapped.azioniComprate).toBe(2.5);
    expect(mapped.prezzoAcquisto).toBe(115);
    expect(mapped.azioniVendute).toBeUndefined();
    expect(mapped.prezzoVendita).toBeUndefined();
  });

  it("defaults nota to '' when null", () => {
    const r = {
      id: "7", data: "2026-02-01", tipo: "acquisto",
      ticker: "EOG", nome: "EOG Resources",
      azioni_comprate: "1", prezzo_acquisto: "100",
      nota: null,
      azioni_vendute: null, prezzo_vendita: null,
      utile_realizzato: null, percentuale: null,
    };
    const mapped = rowToOperazioneConId(r);
    expect(mapped.nota).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. DB mocked integration — getTitoloByTicker and getCategoriaById
// ─────────────────────────────────────────────────────────────────────────────

describe("getTitoloByTicker — mocked DB", () => {
  beforeEach(() => {
    mockSqlFn.mockReset();
  });

  it("returns null when no rows are returned", async () => {
    mockSqlFn.mockResolvedValue([]);
    const { getTitoloByTicker } = await import("@/lib/db");
    const result = await getTitoloByTicker("NONEXISTENT");
    expect(result).toBeNull();
  });

  it("returns a Titolo when a row is found", async () => {
    mockSqlFn.mockResolvedValue([{
      ticker: "EOG", nome: "EOG Resources Inc",
      categoria: "commodities", num_azioni: "2.5",
      prezzo_medio_carico: "115", costo: "287.5",
      valore_attuale: "356", peso_percentuale: "8.45",
      var_prezzo: "27", dividendi: "0",
      profitto_o_perdita: "68.5", pl_percentuale: "23.83",
      pe_ratio: "15.63", isin: "US26875P1012",
      asset_class: "azione", paese: "USA", settore: "energia",
    }]);
    const { getTitoloByTicker } = await import("@/lib/db");
    const result = await getTitoloByTicker("EOG");
    expect(result).not.toBeNull();
    expect(result!.ticker).toBe("EOG");
    expect(result!.numAzioni).toBe(2.5);
    expect(result!.peRatio).toBe(15.63);
    expect(result!.assetClass).toBe("azione");
  });

  it("maps pe_ratio null correctly", async () => {
    mockSqlFn.mockResolvedValue([{
      ticker: "BIL", nome: "SPDR Bloomberg 1-3 Month T-Bill ETF",
      categoria: "obbligazionario", num_azioni: "10",
      prezzo_medio_carico: "91.5", costo: "915",
      valore_attuale: "920", peso_percentuale: "5",
      var_prezzo: "0.5", dividendi: "0",
      profitto_o_perdita: "5", pl_percentuale: "0.5",
      pe_ratio: null, isin: null,
      asset_class: "obbligazione", paese: "USA", settore: "obbligazionario",
    }]);
    const { getTitoloByTicker } = await import("@/lib/db");
    const result = await getTitoloByTicker("BIL");
    expect(result!.peRatio).toBeNull();
    expect(result!.isin).toBeNull();
  });
});

describe("getCategoriaById — mocked DB", () => {
  beforeEach(() => {
    mockSqlFn.mockReset();
  });

  it("returns null when no rows are returned", async () => {
    mockSqlFn.mockResolvedValue([]);
    const { getCategoriaById } = await import("@/lib/db");
    const result = await getCategoriaById("nonexistent-id");
    expect(result).toBeNull();
  });

  it("returns a Categoria when found", async () => {
    mockSqlFn.mockResolvedValue([{
      id: "cat-comm", nome: "Commodities", slug: "commodities",
      peso_percentuale: "13.93", costo: "4000", valore_attuale: "4500",
      profitto_o_perdita: "500", pl_percentuale: "12.5", dividendi: "20",
    }]);
    const { getCategoriaById } = await import("@/lib/db");
    const result = await getCategoriaById("cat-comm");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("cat-comm");
    expect(result!.slug).toBe("commodities");
    expect(result!.pesoPercentuale).toBe(13.93);
    expect(typeof result!.profittoOPerdita).toBe("number");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. getDividendiConId and getOperazioniConId — mocked DB
// ─────────────────────────────────────────────────────────────────────────────

describe("getDividendiConId — mocked DB", () => {
  beforeEach(() => {
    mockSqlFn.mockReset();
  });

  it("returns an empty array when DB is empty", async () => {
    mockSqlFn.mockResolvedValue([]);
    const { getDividendiConId } = await import("@/lib/db");
    const result = await getDividendiConId();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("returns DividendoConId objects with id as a number", async () => {
    mockSqlFn.mockResolvedValue([
      { id: "1", data: "2026-01-15", tipo: "dividendo", descrizione: "ACN Div", ticker: "ACN", importo: "1.63" },
      { id: "2", data: "2026-02-10", tipo: "dividendo", descrizione: "EOG Div", ticker: "EOG", importo: "2.50" },
    ]);
    const { getDividendiConId } = await import("@/lib/db");
    const result = await getDividendiConId();
    expect(result.length).toBe(2);
    expect(result[0].id).toBe(1);
    expect(typeof result[0].id).toBe("number");
    expect(result[0].ticker).toBe("ACN");
    expect(result[0].importo).toBe(1.63);
    expect(result[1].id).toBe(2);
  });

  it("every item has tipo = 'dividendo'", async () => {
    mockSqlFn.mockResolvedValue([
      { id: "3", data: "2026-03-01", tipo: "dividendo", descrizione: "Div", ticker: "V", importo: "0.5" },
    ]);
    const { getDividendiConId } = await import("@/lib/db");
    const result = await getDividendiConId();
    expect(result[0].tipo).toBe("dividendo");
  });
});

describe("getOperazioniConId — mocked DB", () => {
  beforeEach(() => {
    mockSqlFn.mockReset();
  });

  it("returns an empty array when DB is empty", async () => {
    mockSqlFn.mockResolvedValue([]);
    const { getOperazioniConId } = await import("@/lib/db");
    const result = await getOperazioniConId();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("maps vendita rows correctly including optional fields", async () => {
    mockSqlFn.mockResolvedValue([{
      id: "10", data: "2026-01-15", tipo: "vendita",
      ticker: "VAL", nome: "Valaris",
      azioni_vendute: "1.5", prezzo_acquisto: "52",
      prezzo_vendita: "78", utile_realizzato: "39",
      percentuale: "75", nota: "exit",
      azioni_comprate: null,
    }]);
    const { getOperazioniConId } = await import("@/lib/db");
    const result = await getOperazioniConId();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(10);
    expect(result[0].tipo).toBe("vendita");
    expect(result[0].azioniVendute).toBe(1.5);
    expect(result[0].prezzoVendita).toBe(78);
    expect(result[0].azioniComprate).toBeUndefined();
  });

  it("maps acquisto rows correctly", async () => {
    mockSqlFn.mockResolvedValue([{
      id: "11", data: "2026-02-01", tipo: "acquisto",
      ticker: "EOG", nome: "EOG Resources",
      azioni_comprate: "2.5", prezzo_acquisto: "115",
      nota: "entry",
      azioni_vendute: null, prezzo_vendita: null,
      utile_realizzato: null, percentuale: null,
    }]);
    const { getOperazioniConId } = await import("@/lib/db");
    const result = await getOperazioniConId();
    expect(result[0].tipo).toBe("acquisto");
    expect(result[0].azioniComprate).toBe(2.5);
    expect(result[0].azioniVendute).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. addStorico — mocked DB
// ─────────────────────────────────────────────────────────────────────────────

describe("addStorico — mocked DB", () => {
  beforeEach(() => {
    mockSqlFn.mockReset();
    mockSqlFn.mockResolvedValue([]);
  });

  it("resolves without throwing for a valid PuntoStorico", async () => {
    const { addStorico } = await import("@/lib/db");
    await expect(addStorico({ data: "2026-03-25", valore: 30275 })).resolves.not.toThrow();
  });

  it("calls the sql function once (INSERT ... ON CONFLICT)", async () => {
    const { addStorico } = await import("@/lib/db");
    await addStorico({ data: "2026-03-25", valore: 30275 });
    expect(mockSqlFn).toHaveBeenCalledTimes(1);
  });
});
