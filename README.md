# Benefits Calculator – Proof of Concept

A mobile-friendly web application that helps users estimate their eligibility for common U.S. public assistance programs based on household income, size, and other factors.

## Supported Benefit Programs

| Program | Abbreviation | Description |
|---------|-------------|-------------|
| SNAP (Food Stamps) | SNAP | Supplemental Nutrition Assistance Program |
| Medicaid | Medicaid | Health coverage for low-income individuals |
| CHIP | CHIP | Children's Health Insurance Program |
| EITC | EITC | Earned Income Tax Credit |
| Housing Choice Voucher | Section 8 | Rental assistance (Section 8) |
| LIHEAP | LIHEAP | Low Income Home Energy Assistance |
| WIC | WIC | Women, Infants, and Children nutrition program |
| Free/Reduced School Lunch | NSLP | National School Lunch Program |

## Development Phases

### Phase 1 – Project Foundation
- Vite + React + TypeScript project scaffold
- Directory structure (`components/`, `engine/`, `types/`, `data/`, `utils/`)
- README and project documentation

### Phase 2 – Core Calculator Engine
- TypeScript data models for benefits, households, and eligibility
- Federal Poverty Level (FPL) tables and income thresholds
- Eligibility determination logic for each program
- Estimated benefit amount calculations
- Pure-function architecture (no side effects, easy to test)

### Phase 3 – Mobile-Responsive UI
- Multi-step calculator form (household info, income, results)
- Real-time eligibility results display
- Mobile-first responsive design
- Accessible, clean interface

### Phase 4 – (Planned)
- Unit and integration tests
- State-specific rules and thresholds
- PDF/print summary export
- Persistence (localStorage or backend)
- Accessibility audit (WCAG 2.1 AA)

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **Styling:** Plain CSS (no external dependencies)
- **State:** React hooks (useState)
- **Architecture:** Functional / pure-function engine

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/       # React UI components
│   ├── Calculator.tsx
│   ├── HouseholdForm.tsx
│   ├── IncomeForm.tsx
│   └── ResultsDisplay.tsx
├── engine/           # Pure calculation logic
│   ├── eligibility.ts
│   └── benefits.ts
├── types/            # TypeScript interfaces
│   └── index.ts
├── data/             # Static data (FPL tables, thresholds)
│   └── thresholds.ts
├── utils/            # Shared utilities
│   └── format.ts
├── App.tsx
├── App.css
├── index.css
└── main.tsx
```

## Disclaimer

This calculator provides **estimates only** and does not constitute official eligibility determinations. Actual eligibility is determined by the relevant federal, state, or local agency. Rules and thresholds are simplified for this PoC.
