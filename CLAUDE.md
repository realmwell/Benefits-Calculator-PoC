# CLAUDE.md — Benefits Calculator PoC

## Project Overview

A mobile-friendly React web app that estimates user eligibility for 8 U.S. public assistance programs based on household size, income, and demographics. This is a Proof of Concept — thresholds are simplified federal-level approximations, not state-specific.

## Quick Reference

```bash
npm install        # install dependencies
npm run dev        # start dev server on :5173
npm run build      # typecheck + production build
npm run lint       # eslint
```

Build must pass `tsc -b && vite build` with zero errors before committing.

## Tech Stack

- React 19 + TypeScript (strict), Vite 7, plain CSS (no Tailwind, no component library)
- No external state management — uses `useState` hooks
- No test framework installed yet (Phase 4 task)
- No router — single-page multi-step wizard

## Completed Work (Phases 1–3)

### Phase 1 — Foundation
Vite + React + TS scaffold. Directory layout:

```
src/
├── components/    # React UI (Calculator, HouseholdForm, IncomeForm, ResultsDisplay)
├── engine/        # Pure eligibility logic (eligibility.ts, benefits.ts)
├── types/         # All TypeScript interfaces (index.ts)
├── data/          # FPL tables & threshold constants (thresholds.ts)
└── utils/         # Formatting helpers (format.ts)
```

### Phase 2 — Calculator Engine
All calculation logic lives in `src/engine/` as **pure functions** (no side effects, no React dependencies). This makes them straightforward to unit-test.

**Entry point:** `calculateBenefits(household, income)` in `src/engine/benefits.ts`
- Takes `HouseholdInfo` + `IncomeInfo` (defined in `src/types/index.ts`)
- Calls 8 individual `check*` functions from `src/engine/eligibility.ts`
- Returns `CalculatorResult` with per-program eligibility, reasons, and estimated dollar amounts

**Programs implemented** (each has its own `check*` function in `eligibility.ts`):

| Function | Program | Key Threshold |
|----------|---------|---------------|
| `checkSnap` | SNAP / Food Stamps | 130% FPL gross, 100% FPL net |
| `checkMedicaid` | Medicaid (expansion) | 138% FPL |
| `checkChip` | CHIP | 200% FPL, requires children, above Medicaid |
| `checkEitc` | Earned Income Tax Credit | IRS 2024 limits by # of children |
| `checkSection8` | Housing Choice Voucher | ~50% FPL (simplified) |
| `checkLiheap` | LIHEAP energy assistance | 150% FPL |
| `checkWic` | WIC | 185% FPL, requires pregnant/infant/child <6 |
| `checkNslp` | Free/Reduced School Lunch | 130% FPL free, 185% FPL reduced |

**Threshold data** in `src/data/thresholds.ts`:
- `FPL_2024` — 2024 Federal Poverty Level by household size (1–8, plus per-person add-on)
- `SNAP_MAX_ALLOTMENT` — max monthly SNAP by household size
- `EITC_2024` — income limits + max credit by number of qualifying children
- Named constants for every program's FPL percentage cutoff

**Known simplifications** (intentional for PoC):
- Section 8 uses FPL percentage as a proxy for area median income
- Medicaid assumes ACA expansion state
- EITC benefit estimate uses a linear ratio (not the actual phase-in/phase-out schedule)
- LIHEAP and WIC benefit amounts are rough national averages
- Net income defaults to 80% of gross if not provided
- `HouseholdInfo.state` field exists but is not yet used (always "US")

### Phase 3 — Mobile-First UI
3-step wizard in `src/components/Calculator.tsx` controlling `FormStep` state:
1. **HouseholdForm** — household size, children counts, checkboxes for pregnant/elderly/disabled
2. **IncomeForm** — gross monthly, net monthly (optional), annual earned, filing status, investment income flag
3. **ResultsDisplay** — summary card (FPL%, eligible count, estimated totals), per-program result cards (eligible green / ineligible gray), disclaimer

Styling: `src/index.css` (CSS variables/reset) + `src/App.css` (all component styles). Mobile-first with a `@media (min-width: 768px)` breakpoint for desktop.

## Phase 4 — What To Build Next

These are the planned next steps (pick up here):

1. **Testing** — Install Vitest (or Jest). Write unit tests for every `check*` function in `eligibility.ts` with edge cases (at threshold, over/under, elderly/disabled exemptions, zero income). Test `calculateBenefits` integration. Consider React Testing Library for component smoke tests.

2. **State-specific rules** — The `HouseholdInfo.state` field is already in the type but unused. Add a state selector dropdown to HouseholdForm. Create a `src/data/stateRules.ts` with per-state overrides (e.g., Medicaid expansion vs. non-expansion, varying CHIP limits). Wire into eligibility functions.

3. **PDF/print summary** — Add a "Download PDF" or "Print Results" button to ResultsDisplay. Consider `react-to-print` or `jsPDF` for generating a summary with household info + all results.

4. **Persistence** — Save form state to `localStorage` so users don't lose progress on page refresh. Consider a "Save & Share" feature that encodes state into a URL hash.

5. **Accessibility audit** — Ensure WCAG 2.1 AA compliance: proper `aria-` attributes on the wizard, focus management between steps, screen-reader announcements for results, sufficient color contrast ratios.

## Architecture Decisions

- **Pure engine / UI separation**: All eligibility logic is in `src/engine/` with zero React imports. This is intentional — keep it this way so the engine can be tested independently and potentially reused server-side.
- **No routing**: The wizard uses `useState<FormStep>` to swap views. If the app grows beyond the calculator, consider adding `react-router`.
- **No external CSS framework**: Styles are intentionally plain CSS with CSS variables. This keeps the bundle tiny and avoids framework lock-in. Maintain this approach unless there's a strong reason to change.
- **Threshold data as constants**: All FPL/program thresholds are named exports in `thresholds.ts`. When adding state-specific rules, extend this pattern rather than embedding magic numbers in eligibility functions.
