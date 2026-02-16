# DC Benefits Finder — Session Handoff

## What Was Built (All 5 Phases Complete + Thresholds Verified)

This repo contains a DC-specific Benefits Finder: a web app helping DC residents discover government benefits they may qualify for. All code is on `claude/phases-1-3-mobile-NYKxV` at `realmwell/Benefits-Calculator-PoC`.

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
- **RAG engine** (`backend/lambda/rag_engine.py`): Embed question -> FAISS top-5 retrieval -> prompt assembly -> Bedrock Claude 3.5 Haiku -> answer with source citations
- **Chat UI** (`frontend/src/components/chat/ChatPanel.tsx`): Graceful degradation when backend unavailable
- **NOT YET RUN**: Corpus download and embedding generation require AWS credentials with Bedrock access

### Phase 5: Infrastructure
- **SAM template** (`infrastructure/template.yaml`): S3 bucket, CloudFront distribution with OAI, API Gateway with throttling, Lambda with 10 concurrent limit, Bedrock IAM policies
- **Budget alarm** (`infrastructure/budget-alarm.yaml`): $10/month cap, email alerts at 80%/90%/100%, deny-all IAM policy for cost cap
- **CI/CD** (`.github/workflows/deploy.yml`): Build + type check + deploy to S3 + CloudFront invalidation
- **README.md**: Architecture diagram, setup instructions, deployment guide, threshold update guide

### Threshold Verification (completed)
All 14 programs verified against official 2025 sources. Fixes applied and committed:

| Fix | File | What Changed |
|-----|------|-------------|
| SNAP standard deduction | `data/snap.ts` | Updated from outdated 2-tier ($198/$213) to FY2025 4-tier ($204/$217/$254/$291) |
| EITC max credits | `programs/eitc.ts` | 1-child: $4,213->$4,328; 2-child: $6,960->$7,152 |
| EITC income limits | `programs/eitc.ts` | Updated 6 values (1/2/3+ children, single + married) from 2024->2025 tax year |
| LIHEAP SMI table | `data/fpl.ts` | Replaced national 60% SMI with DC-specific values from DOEE (e.g. HH1: $42,180->$61,841) |
| Child Care Subsidy | `programs/childCareSubsidy.ts` | Income limit 250%->300% FPL per DC's Oct 2023 expansion |

**Confirmed correct (no changes needed):** FPL base/increment, SNAP allotments, Medicaid thresholds (children 319%, adults 215%, Alliance 200%), TANF, SSI ($967/$1,450), Unemployment ($444/wk, 26 wks), WIC (185% FPL), Paid Family Leave ($1,190/wk), Property Tax (Homestead $89,850, Schedule H $750 max), School Meals (130%/185% FPL), Kids Ride Free (ages 5-21).

## Current State

| Check | Status |
|-------|--------|
| TypeScript compilation | Clean (zero errors) |
| Vite production build | Passes (311 KB JS, 6.5 KB CSS) |
| Engine tests (4 personas) | All passing |
| 2025 threshold verification | Complete — all 14 programs verified |
| Git status | Clean, pushed to remote |

### Test Persona Results
1. **Single adult, laid off**: SNAP, Medicaid, Unemployment, LIHEAP, Property Tax
2. **Single parent, 2 kids, part-time**: SNAP, Medicaid, EITC, LIHEAP, WIC, School Meals, Kids Ride Free + may qualify for Paid Family Leave, Child Care Subsidy
3. **Senior couple, homeowners**: Medicaid, LIHEAP, Property Tax Relief + may qualify for SNAP, SSI
4. **Undocumented, working**: DC Healthcare Alliance, EITC, LIHEAP, WIC, School Meals + may qualify for Paid Family Leave, Child Care Subsidy, Kids Ride Free

## What's Left To Do

### Must-do before launch
1. **Run the RAG corpus pipeline** — `cd backend/scripts && pip install requests beautifulsoup4 && python build_corpus.py && pip install boto3 faiss-cpu numpy && python build_embeddings.py` (requires AWS credentials with Bedrock access in us-east-1)
2. **Deploy infrastructure** — `cd infrastructure && sam build && sam deploy --guided` (requires AWS account)
3. **Set VITE_CHAT_API_URL** — After deploying, set this env var to the API Gateway URL and rebuild frontend
4. **Upload frontend to S3** — `aws s3 sync frontend/dist/ s3://BUCKET --delete`
5. **Configure GitHub secrets** — AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, CF_DIST_ID for CI/CD
6. **Set up AWS Budget Action** — The CloudFormation template creates the budget and deny policy, but the Budget Action must be configured via console or CLI

### Should-do improvements
7. **Update FPL to 2026** — 2026 guidelines published Jan 2026: base=$15,960 (was $15,650), increment=$5,680 (was $5,500). Update `data/fpl.ts` and reference table comment when ready.
8. **Add edge case tests** — 4 personas pass but spec calls for per-program unit tests covering threshold boundaries, already-receiving, citizenship disqualifiers, elderly/disabled provisions
9. **Cross-browser testing** — Only tested via Vite build; needs Safari, Firefox, mobile browser verification
10. **Accessibility audit** — Has skip link, aria labels, focus management, but needs screen reader testing and color contrast verification

### Nice-to-have / future
11. **Substack post** — Defined in the project prompt but not yet drafted (`docs/substack-draft.md`)
12. **Route 53 custom domain** — Optional, adds ~$0.50/month
13. **Multi-language support** — Deferred per spec
14. **RAG quality tests** — `tests/rag/` directory exists but no tests written yet

## RAG Pipeline Assessment

The corpus builder and embeddings builder scripts are well-structured and ready to run. Key observations:

- **build_corpus.py**: Downloads 26 URLs, extracts text via BeautifulSoup, chunks at ~400 tokens with 50-token overlap. Has rate limiting (1s per URL). Output: `backend/corpus/processed/all_chunks.jsonl`
- **build_embeddings.py**: Reads JSONL, calls Bedrock Titan v2 for 1024-dim embeddings, builds FAISS IndexFlatIP. Rate limited at 0.1s per chunk. Falls back to zero vectors on error. Output: `backend/corpus/embeddings/benefits.faiss` + `chunks_metadata.json`
- **Lambda handler**: Budget checks against Cost Explorer ($10 hard stop, $9 warning), validates input (non-empty, max 1000 chars), CORS support
- **RAG engine**: Lazy-loads FAISS index on cold start, top-5 retrieval, prompt includes DC-specific system instructions

**To run**: Need AWS credentials with `bedrock:InvokeModel` for `amazon.titan-embed-text-v2:0` and `anthropic.claude-3-5-haiku-20241022-v1:0` in us-east-1.

## SAM Deployment Assessment

The SAM template is production-ready with proper cost controls:

- **Lambda**: Python 3.12, 512MB, 30s timeout, 10 concurrent max
- **API Gateway**: POST /chat + OPTIONS, 10 req/sec throttle
- **S3**: Private bucket with OAI, public access blocked
- **CloudFront**: HTTPS redirect, SPA routing (404/403 -> index.html), PriceClass_100
- **Budget**: Separate template with $10/month cap, 3 notification tiers, IAM deny policy

**Note**: The FAISS layer (`FAISSLayer`) references `../backend/corpus/embeddings/` which must exist before `sam build`. Run the corpus/embeddings pipeline first.

## Key Files

```
frontend/
├── src/engine/                    # All eligibility logic (pure TS, no React)
│   ├── types.ts                   # UserProfile, ProgramResult interfaces
│   ├── eligibility.ts             # Orchestrator — runs all 14 checkers
│   ├── data/fpl.ts                # 2025 FPL tables + DC-specific 60% SMI
│   ├── data/snap.ts               # SNAP allotments, deductions (FY2025)
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
├── scripts/build_corpus.py        # Download + chunk DC benefit docs (26 URLs)
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

## Architecture Notes

- **Frontend engine** is pure TypeScript with zero React dependencies — can be tested and reused independently
- **All eligibility is deterministic and client-side** — no data leaves the browser for the questionnaire flow
- **RAG chatbot is additive** — the app works fully without it (graceful degradation in ChatPanel)
- **Cost protection is multi-layered**: Lambda concurrent limit (10), API Gateway throttle (10 req/sec), budget alarm ($10/month), deny-all IAM policy
- **Every threshold has source URL comments** for annual verification and updates

## Git Info
- **Repo:** `realmwell/Benefits-Calculator-PoC`
- **Branch:** `claude/phases-1-3-mobile-NYKxV`
- **Latest commit:** `fix: correct 2025 benefit thresholds against official sources`
