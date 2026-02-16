# DC Benefits Finder — Development Guide

## Project Overview
Web app helping DC residents find government benefits they may qualify for.
Two modes: deterministic questionnaire (client-side) and RAG chatbot (server-side).

## Architecture
- **Frontend:** React + TypeScript + Vite in `frontend/`
- **Engine:** Pure TypeScript eligibility logic in `frontend/src/engine/` (no React deps)
- **Backend:** Python Lambda + Bedrock in `backend/lambda/`
- **Infrastructure:** SAM/CloudFormation in `infrastructure/`

## Key Commands
```bash
# Frontend dev
cd frontend && npm run dev

# Type check
cd frontend && npx tsc -b

# Build
cd frontend && npm run build

# Run engine tests
cd frontend && npx tsx ../tests/engine/test_eligibility.ts

# Build RAG corpus (requires AWS credentials)
cd backend/scripts && python build_corpus.py && python build_embeddings.py
```

## Adding/Updating a Benefit Program
1. Create or edit the program file in `frontend/src/engine/programs/`
2. Add source URL comments for every threshold
3. Import and add to the checkers array in `frontend/src/engine/eligibility.ts`
4. Add test scenarios to `tests/engine/test_eligibility.ts`
5. Update FPL tables in `frontend/src/engine/data/fpl.ts` if needed (annually in January)

## Design Decisions
- One question per screen (GOV.UK pattern)
- All eligibility logic deterministic and client-side
- No data persistence (no localStorage, no cookies, no server-side storage)
- System font stack (no web fonts)
- WCAG 2.1 AA accessibility
- Hard $10/month AWS budget cap
