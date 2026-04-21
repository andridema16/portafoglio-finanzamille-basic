# Fix Spaziatura e Dimensioni Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ridurre padding, font-size e gap su mobile per eliminare lo spreco di spazio verticale, rendendo il sito compatto come Trade Republic su telefono.

**Architecture:** Usare classi Tailwind responsive (`md:` prefix) per ridurre spacing/sizing su mobile mantenendo il layout desktop invariato. Interveniamo su 2 file: il layout wrapper e la dashboard page. Le pagine composizione e categoria hanno gia' il layout mobile a card (deploy in corso).

**Tech Stack:** Tailwind CSS v4 (responsive utilities), Next.js 16 Server Components

---

## Analisi Screenshot

Dai 3 screenshot WhatsApp su iPhone emergono questi problemi:

### Screenshot 1 — Hero Dashboard
- **Card esterna `p-6`** (24px): troppo padding su mobile, spreca spazio
- **Titoli card metriche `text-xl`**: troppo grandi, i valori come "$29,792.00" occupano troppo
- **Gap griglia `gap-4`** (16px): eccessivo tra le 4 card
- **"VALORE TOTALE" `text-lg uppercase`**: label troppo grande
- **Importo totale `text-2xl`**: troppo grande su schermo piccolo
- **Spaziatura `mb-6`** tra header e card: troppo generosa
- **Sotto-etichette** come "P&L (incl. dividendi) + Utili realizzati" vanno a capo e occupano spazio

### Screenshot 2 — Grafico + inizio Categorie
- Il grafico occupa lo spazio giusto
- La sezione Categorie sotto mostra ancora la tabella desktop (pre-deploy)

### Screenshot 3 — Tabella Categorie
- La tabella desktop e' visibile su mobile con scroll orizzontale (fix gia' deployato, in propagazione)

### Layout wrapper
- `p-6 pt-16 lg:pt-6`: 24px padding orizzontale su mobile — troppo per uno schermo da 375px
- `space-y-6` tra le sezioni: 24px gap verticale — riducibile

---

## File Structure

| File | Azione | Responsabilita' |
|------|--------|-----------------|
| `src/app/(protected)/[portfolio]/layout.tsx` | Modify | Ridurre padding mobile del content wrapper |
| `src/app/(protected)/[portfolio]/dashboard/page.tsx` | Modify | Compattare hero, card, totale, liquidita' per mobile |

---

### Task 1: Ridurre padding del layout wrapper su mobile

**Files:**
- Modify: `src/app/(protected)/[portfolio]/layout.tsx`

- [ ] **Step 1: Leggere il file layout corrente**

Il file ha questa riga chiave:
```tsx
<div className="p-6 pt-16 lg:pt-6">
```

- [ ] **Step 2: Cambiare il padding mobile**

Sostituire:
```tsx
<div className="p-6 pt-16 lg:pt-6">
```
Con:
```tsx
<div className="p-4 pt-16 md:p-6 lg:pt-6">
```

Questo riduce il padding orizzontale/bottom da 24px a 16px su mobile. Desktop invariato.

- [ ] **Step 3: Ridurre anche space-y tra sezioni se presente nel wrapper**

Se il layout o il dashboard usano `space-y-6`, valutare `space-y-4 md:space-y-6` dove applicabile. Il dashboard page ha `<div className="space-y-6">` alla riga 113. Sostituire con:
```tsx
<div className="space-y-4 md:space-y-6">
```

- [ ] **Step 4: Verificare build**

```bash
cd app && npm run build
```
Expected: Build riuscita senza errori.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/\[portfolio\]/layout.tsx src/app/\(protected\)/\[portfolio\]/dashboard/page.tsx
git commit -m "fix: ridurre padding layout e gap sezioni su mobile"
```

---

### Task 2: Compattare la hero card del dashboard su mobile

**Files:**
- Modify: `src/app/(protected)/[portfolio]/dashboard/page.tsx:114-125`

- [ ] **Step 1: Ridurre padding hero card**

Riga 115 — sostituire:
```tsx
<div className="bg-white rounded-xl shadow-sm p-6">
```
Con:
```tsx
<div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
```

- [ ] **Step 2: Ridurre margin-bottom dell'intestazione**

Riga 117 — sostituire:
```tsx
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-6">
```
Con:
```tsx
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-3 md:mb-6">
```

- [ ] **Step 3: Ridurre gap e font size della griglia metriche**

Riga 128 — sostituire:
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
```
Con:
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
```

- [ ] **Step 4: Compattare le 4 card metriche per mobile**

Per OGNUNA delle 4 card metriche (Capitale Investito, Dividendi, Utile Realizzato, Guadagno Totale), applicare:

Padding card — sostituire `p-4` con `p-3 md:p-4`:
```tsx
<div className="relative bg-gray-50 rounded-lg p-3 md:p-4">
```

Font importo — sostituire `text-xl` con `text-base md:text-xl`:
```tsx
<p className="text-base md:text-xl font-bold text-nero mt-1">
```
(Ripetere per tutte e 4 le card, incluse quelle con classi dinamiche `colorePL`)

Sotto-etichette — nascondere su mobile dove troppo verbose. Per la card "Guadagno Totale" (riga 174), sostituire:
```tsx
<p className="text-xs text-gray-400 mt-1">P&L (incl. dividendi) + Utili realizzati</p>
```
Con:
```tsx
<p className="text-xs text-gray-400 mt-1 hidden md:block">P&L (incl. dividendi) + Utili realizzati</p>
<p className="text-xs text-gray-400 mt-1 md:hidden">P&L + Utili</p>
```

- [ ] **Step 5: Verificare build**

```bash
cd app && npm run build
```
Expected: Build riuscita senza errori.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(protected\)/\[portfolio\]/dashboard/page.tsx
git commit -m "fix: compattare card metriche dashboard su mobile"
```

---

### Task 3: Compattare la sezione "Valore Totale" e Liquidita' su mobile

**Files:**
- Modify: `src/app/(protected)/[portfolio]/dashboard/page.tsx:178-209`

- [ ] **Step 1: Ridurre la sezione Valore Totale su mobile**

Riga 179 — sostituire:
```tsx
<div className="border-t border-gray-200 pt-4 mt-4 flex items-center justify-between">
```
Con:
```tsx
<div className="border-t border-gray-200 pt-3 mt-3 md:pt-4 md:mt-4 flex items-center justify-between">
```

Riga 181 — label "Valore Totale" — sostituire:
```tsx
<p className="text-lg font-semibold text-nero uppercase tracking-wide">
```
Con:
```tsx
<p className="text-sm md:text-lg font-semibold text-nero uppercase tracking-wide">
```

Riga 187 — importo — sostituire:
```tsx
<p className="text-2xl font-bold text-nero">
```
Con:
```tsx
<p className="text-xl md:text-2xl font-bold text-nero">
```

Riga 191 — percentuale TWR — sostituire:
```tsx
<p className={`text-lg font-bold ${colorePL(twrPercentuale)}`}>
```
Con:
```tsx
<p className={`text-sm md:text-lg font-bold ${colorePL(twrPercentuale)}`}>
```

Riga 194 — P&L importo — sostituire:
```tsx
<p className={`text-sm font-medium ${colorePL(portafoglio.profittoOPerdita)}`}>
```
Con:
```tsx
<p className={`text-xs md:text-sm font-medium ${colorePL(portafoglio.profittoOPerdita)}`}>
```

- [ ] **Step 2: Compattare la sezione Liquidita'**

Riga 203 — sostituire:
```tsx
<div className="bg-gray-50 rounded-lg p-4 mt-4">
```
Con:
```tsx
<div className="bg-gray-50 rounded-lg p-3 mt-3 md:p-4 md:mt-4">
```

- [ ] **Step 3: Compattare la card Categorie**

Riga 222 — sostituire:
```tsx
<div className="bg-white rounded-xl shadow-sm p-6">
```
Con:
```tsx
<div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
```

Riga 223 — titolo — sostituire:
```tsx
<h3 className="text-lg font-semibold text-nero mb-4">Categorie</h3>
```
Con:
```tsx
<h3 className="text-base md:text-lg font-semibold text-nero mb-3 md:mb-4">Categorie</h3>
```

- [ ] **Step 4: Verificare build**

```bash
cd app && npm run build
```
Expected: Build riuscita senza errori.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/\[portfolio\]/dashboard/page.tsx
git commit -m "fix: compattare valore totale, liquidita e categorie su mobile"
```

---

### Task 4: Build finale, QA e deploy

- [ ] **Step 1: Build completa**

```bash
cd app && npm run build
```

- [ ] **Step 2: Lint**

```bash
cd app && npm run lint
```

- [ ] **Step 3: Commit finale se necessario e push**

```bash
git push origin main
```

- [ ] **Step 4: Verificare il deploy su Vercel**

Aspettare la propagazione e verificare su telefono che:
- Le card metriche sono piu' compatte
- "VALORE TOTALE" non domina lo schermo
- Il padding laterale e' ridotto
- Le categorie mostrano il layout a card (non tabella)
- Nessun scroll orizzontale da nessuna parte
