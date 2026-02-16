# DC Benefits Finder — Session Handoff

## What Was Built (All 5 Phases Complete)

This session rebuilt the repo from a generic U.S. benefits calculator PoC into a DC-specific Benefits Finder per the full project prompt. All code is committed and pushed to `claude/phases-1-3-mobile-NYKxV` on `realmwell/Benefits-Calculator-PoC`.

### Phase 1: Eligibility Engine
- **14 DC benefit programs** with deterministic, client-side eligibility logic
- Programs: SNAP, Medicaid/DC Healthcare Alliance, TANF, DC EITC, DC Paid Family Leave, Unemployment Insurance, LIHEAP, WIC, Child Care Subsidy, Property Tax Relief (5 sub-programs), SSI, IDA, School Meals, Kids Ride Free
- **2025 FPL tables** with helper functions (`getFPL`, `getFPLAtPercent`, `getMonthlyFPLAtPercent`)
- **SNAP benefit calculator** with full deduction logic (standard, earned income, shelter, dependent care, medical)
- **DC-specific rules** encoded: BBCE (no asset test for SNAP), 200% FPL gross limit, DC Healthcare Alliance for undocumented residents, 100% EITC match for TY2025, ITIN holder eligibility
- Every threshold has a source URL comment in the code
- Location: `frontend/src/engine/`

### Phase 2: Questionnaire UI
- **One-question-per-screen** GOV.UK/USWDS pattern
- **5 sections**, ~25 questions with conditional logic (e.g., child ages only shown if children > 0, rent only shown if housing = rent)
- Progress bar, back/forward navigation, validation
- Mobile-first responsive CSS, system font stack, 44px minimum touch targets
- WCAG 2.1 AA: skip link, focus management, aria labels, screen reader announcements
- Location: `frontend/src/components/questionnaire/`

### Phase 3: Results + About
- **Three-tier results display**: likely eligible, may be eligible, probably don't qualify
- Estimated benefit totals (monthly + annual)
- Per-program cards with: estimated amount, plain-language reasoning, caveats, apply links, collapsible source URLs
- **Review screen** showing all answers before calculation
- **About page** with data sources, architecture, limitations, contact info
- **Required disclaimers** on results page
- Location: `frontend/src/components/results/`, `frontend/src/components/about/`

### Phase 4: RAG Chatbot
- **Corpus builder** (`backend/scripts/build_corpus.py`): Downloads 26 DC benefit source URLs, extracts text via BeautifulSoup, chunks into ~400-token passages with 50-token overlap, outputs JSONL
- **Embeddings builder** (`backend/scripts/build_embeddings.py`): Embeds chunks via Bedrock Titan v2, builds FAISS IndexFlatIP (cosine similarity), outputs .faiss + metadata JSON
- **Lambda handler** (`backend/lambda/chat_handler.py`): POST /chat endpoint with CORS, budget check via Cost Explorer, input validation
- **RAG engine** (`backend/lambda/rag_engine.py`): Embed question → FAISS top-5 retrieval → prompt assembly → Bedrock Claude 3.5 Haiku → answer with source citations
- **Chat UI** (`frontend/src/components/chat/ChatPanel.tsx`): Graceful degradation when backend unavailable
- **NOT YET RUN**: Corpus download and embedding generation require AWS credentials with Bedrock access

### Phase 5: Infrastructure
- **SAM template** (`infrastructure/template.yaml`): S3 bucket, CloudFront distribution with OAI, API Gateway with throttling, Lambda with 10 concurrent limit, Bedrock IAM policies
- **Budget alarm** (`infrastructure/budget-alarm.yaml`): $10/month cap, email alerts at 80%/90%/100%, deny-all IAM policy for cost cap
- **CI/CD** (`.github/workflows/deploy.yml`): Build + type check + deploy to S3 + CloudFront invalidation
- **README.md**: Architecture diagram, setup instructions, deployment guide, threshold update guide

## Current State

| Check | Status |
|-------|--------|
| TypeScript compilation | Clean (zero errors) |
| Vite production build | Passes (311 KB JS, 6.5 KB CSS) |
| Engine tests (4 personas) | All passing |
| Git status | Clean, pushed to remote |

### Test Persona Results
1. **Single adult, laid off**: SNAP, Medicaid, Unemployment, LIHEAP, Property Tax
2. **Single parent, 2 kids, part-time**: SNAP, Medicaid, EITC, LIHEAP, WIC, School Meals, Kids Ride Free + may qualify for Paid Family Leave, Child Care Subsidy
3. **Senior couple, homeowners**: Medicaid, LIHEAP, Property Tax Relief + may qualify for SNAP, SSI
4. **Undocumented, working**: DC Healthcare Alliance, EITC, LIHEAP, WIC, School Meals + may qualify for Paid Family Leave, Child Care Subsidy, Kids Ride Free

## What's Left To Do

### Must-do before launch
1. **Run the RAG corpus pipeline** — `cd backend/scripts && python build_corpus.py && python build_embeddings.py` (requires AWS credentials with Bedrock access in us-east-1)
2. **Deploy infrastructure** — `cd infrastructure && sam build && sam deploy --guided` (requires AWS account)
3. **Set VITE_CHAT_API_URL** — After deploying, set this env var to the API Gateway URL and rebuild frontend
4. **Upload frontend to S3** — `aws s3 sync frontend/dist/ s3://BUCKET --delete`
5. **Configure GitHub secrets** — AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, CF_DIST_ID for CI/CD
6. **Set up AWS Budget Action** — The CloudFormation template creates the budget and deny policy, but the Budget Action (which automatically applies the deny policy when budget is exceeded) must be configured via console or CLI

### Should-do improvements
7. **Verify all 2025 thresholds** — Cross-check FPL tables, SNAP allotments, EITC limits, TANF limits against current official sources. Some DC-specific thresholds (TANF income limits, LIHEAP SMI) are approximated.
8. **Add edge case tests** — The test file covers 4 personas but the spec calls for per-program unit tests covering threshold boundaries, already-receiving, citizenship disqualifiers, elderly/disabled provisions
9. **Cross-browser testing** — Only tested via Vite build; needs Safari, Firefox, mobile browser verification
10. **Accessibility audit** — Has skip link, aria labels, focus management, but needs screen reader testing and color contrast verification

### Nice-to-have / future
11. **Substack post** — Defined in the project prompt but not yet drafted (`docs/substack-draft.md`)
12. **Route 53 custom domain** — Optional, adds ~$0.50/month
13. **Multi-language support** — Deferred per spec
14. **RAG quality tests** — `tests/rag/` directory exists but no tests written yet (need deployed backend)

## Key Files

```
frontend/
├── src/engine/                    # All eligibility logic (pure TS, no React)
│   ├── types.ts                   # UserProfile, ProgramResult interfaces
│   ├── eligibility.ts             # Orchestrator — runs all 14 checkers
│   ├── data/fpl.ts                # 2025 FPL tables
│   ├── data/snap.ts               # SNAP allotments, deductions
│   └── programs/                  # One file per program (14 files)
├── src/components/
│   ├── questionnaire/             # Question definitions, screen renderer, progress
│   ├── results/                   # Results display, ProgramCard, ReviewScreen
│   ├── chat/ChatPanel.tsx         # RAG chat interface
│   ├── about/About.tsx            # About page with sources
│   └── shared/                    # Layout, Nav, Footer, Landing, NotDC
├── src/App.tsx                    # React Router setup
├── src/main.tsx                   # Entry point
└── src/index.css                  # Global styles

backend/
├── lambda/chat_handler.py         # Lambda entry point
├── lambda/rag_engine.py           # FAISS retrieval + Bedrock inference
├── scripts/build_corpus.py        # Download + chunk DC benefit docs
└── scripts/build_embeddings.py    # Generate FAISS index via Titan v2

infrastructure/
├── template.yaml                  # SAM template (full AWS stack)
└── budget-alarm.yaml              # $10/month budget cap

tests/engine/test_eligibility.ts   # 4-persona integration tests
```

## Commands

```bash
# Dev server
cd frontend && npm run dev

# Type check
cd frontend && npx tsc -b

# Build
cd frontend && npm run build

# Run tests
cd frontend && npx tsx ../tests/engine/test_eligibility.ts

# Build corpus (requires AWS)
cd backend/scripts && pip install requests beautifulsoup4 && python build_corpus.py

# Build embeddings (requires AWS Bedrock)
cd backend/scripts && pip install boto3 faiss-cpu numpy && python build_embeddings.py

# Deploy (requires AWS CLI + SAM CLI)
cd infrastructure && sam build && sam deploy --guided
```

## Git Info
- **Repo:** `realmwell/Benefits-Calculator-PoC`
- **Branch:** `claude/phases-1-3-mobile-NYKxV`
- **Latest commit:** `feat: rebuild as DC Benefits Finder with all 5 phases`
