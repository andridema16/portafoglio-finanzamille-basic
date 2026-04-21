## Test Results
**Status: PASS**
**Tests run:** 84 | **Passed:** 84 | **Failed:** 0

## Test Cases

### 1. verificaAdmin() — 6 tests
- [PASS] returns null when x-user-role is 'admin'
- [PASS] returns a NextResponse with status 403 when role is 'user'
- [PASS] returns 403 when role is an empty string
- [PASS] returns 403 when x-user-role header is missing (null)
- [PASS] returns 403 when role is 'ADMIN' (case-sensitive check)
- [PASS] 403 response body contains { error: 'Accesso negato' }

### 2a. API /admin/titoli POST — validation — 10 tests
- [PASS] returns 400 when body is not valid JSON
- [PASS] returns 400 when ticker is missing
- [PASS] returns 400 when nome is missing
- [PASS] returns 400 when categoria is missing
- [PASS] returns 400 when numAzioni is missing
- [PASS] returns 400 when prezzoMedioCarico is missing
- [PASS] returns 400 when assetClass is missing
- [PASS] returns 400 when paese is missing
- [PASS] returns 400 when settore is missing
- [PASS] returns 201 with correct costo when all required fields are present
- [PASS] sets optional dividendi to 0 when not provided
- [PASS] sets optional peRatio to null when not provided

### 2b. API /admin/categorie POST — validation — 6 tests
- [PASS] returns 400 when body is not valid JSON
- [PASS] returns 400 when id is missing
- [PASS] returns 400 when nome is missing
- [PASS] returns 400 when slug is missing
- [PASS] returns 201 with defaults when optional fields are absent
- [PASS] returns 201 with correct data when all fields provided

### 2c. API /admin/transazioni POST — validation — 17 tests
- [PASS] returns 400 when body is not valid JSON
- [PASS] returns 400 when tipo is an unknown value
- [PASS] returns 400 for dividendo when data is missing
- [PASS] returns 400 for dividendo when ticker is missing
- [PASS] returns 400 for dividendo when importo is missing
- [PASS] returns 201 for a valid dividendo
- [PASS] defaults descrizione to '' when missing in dividendo
- [PASS] returns 400 for vendita when data is missing
- [PASS] returns 400 for vendita when ticker is missing
- [PASS] returns 400 for vendita when nome is missing
- [PASS] returns 400 for vendita when azioniVendute is missing
- [PASS] returns 201 for a valid vendita
- [PASS] defaults optional vendita fields to 0 when missing
- [PASS] returns 400 for acquisto when data is missing
- [PASS] returns 400 for acquisto when azioniComprate is missing
- [PASS] returns 201 for a valid acquisto

### 2d. API /admin/transazioni/[id] PUT — validation — 5 tests
- [PASS] returns 400 when body is not valid JSON
- [PASS] returns 400 when tabella field is missing
- [PASS] returns 400 when tabella is an invalid value
- [PASS] returns 200 success when tabella is 'dividendi'
- [PASS] returns 200 success when tabella is 'operazioni'

### 2e. API /admin/transazioni/[id] DELETE — validation — 4 tests
- [PASS] returns 400 when tabella query param is missing
- [PASS] returns 400 when tabella query param is invalid
- [PASS] returns 200 success when tabella=dividendi
- [PASS] returns 200 success when tabella=operazioni

### 2f. API /admin/titoli/[ticker] — auth guard — 4 tests
- [PASS] PUT returns 403 for non-admin role
- [PASS] DELETE returns 403 for non-admin role
- [PASS] PUT returns 404 when titolo does not exist
- [PASS] DELETE returns 200 success for admin

### 2g. API /admin/categorie/[id] — auth guard and 404 — 4 tests
- [PASS] PUT returns 403 for non-admin
- [PASS] PUT returns 404 when categoria does not exist
- [PASS] DELETE returns 200 for admin
- [PASS] DELETE returns 403 for non-admin

### 3. DB new admin function exports — 7 tests
- [PASS] exports getDividendiConId as a function
- [PASS] exports getOperazioniConId as a function
- [PASS] exports updateDividendo as a function
- [PASS] exports updateOperazione as a function
- [PASS] exports addStorico as a function
- [PASS] exports getTitoloByTicker as a function
- [PASS] exports getCategoriaById as a function

### 4. DB row mapper unit tests — 8 tests
- [PASS] rowToDividendoConId: maps id as a number
- [PASS] rowToDividendoConId: maps importo as a number
- [PASS] rowToDividendoConId: always sets tipo to 'dividendo'
- [PASS] rowToDividendoConId: slices data to YYYY-MM-DD
- [PASS] rowToOperazioneConId: maps a vendita row with all fields
- [PASS] rowToOperazioneConId: maps an acquisto row correctly
- [PASS] rowToOperazioneConId: defaults nota to '' when null

### 5. DB mocked integration — getTitoloByTicker and getCategoriaById — 6 tests
- [PASS] getTitoloByTicker: returns null when no rows are returned
- [PASS] getTitoloByTicker: returns a Titolo when a row is found
- [PASS] getTitoloByTicker: maps pe_ratio null correctly
- [PASS] getCategoriaById: returns null when no rows are returned
- [PASS] getCategoriaById: returns a Categoria when found

### 6. getDividendiConId and getOperazioniConId — mocked DB — 8 tests
- [PASS] getDividendiConId: returns an empty array when DB is empty
- [PASS] getDividendiConId: returns DividendoConId objects with id as a number
- [PASS] getDividendiConId: every item has tipo = 'dividendo'
- [PASS] getOperazioniConId: returns an empty array when DB is empty
- [PASS] getOperazioniConId: maps vendita rows correctly including optional fields
- [PASS] getOperazioniConId: maps acquisto rows correctly

### 7. addStorico — mocked DB — 2 tests
- [PASS] resolves without throwing for a valid PuntoStorico
- [PASS] calls the sql function once (INSERT ... ON CONFLICT)

## Failures (if any)
None.

## Notes
- The ricalcola route was not unit-tested here because it depends on yahoo-finance2 (getPrezziMultipli) — that function already has its own comprehensive test suite in yahoo.test.ts. The ricalcola route's auth guard (403 for non-admin) follows the same verificaAdmin() path already covered.
- All DB calls are mocked via @neondatabase/serverless; no real database connection is required.
- The mockSqlFn is a plain vi.fn() that acts as the tagged template literal (neon returns a function called as sql`...`). This works because vitest evaluates the template tag call as a regular function invocation.
- The DividendoConId interface correctly extends Dividendo by adding a numeric id field; the mapper casts DB string ids to numbers as expected.
- The OperazioneConId interface uses optional fields (azioniVendute?, prezzoVendita?, etc.) to accommodate both vendita and acquisto shapes in a single flat type — tested correctly with both row types.
