# DC Benefits Finder

A web application that helps Washington, DC residents discover government benefits they may be eligible for but aren't claiming.

**Two modes:**
1. **Questionnaire:** Step-by-step intake form that runs deterministic eligibility logic against 14 DC benefit programs. Outputs personalized results with estimated amounts and direct links to apply.
2. **Chat assistant:** Ask questions about DC benefits in plain English. Powered by RAG (Retrieval-Augmented Generation) using official DC government documentation.

Inspired by [MissingBenefit.com](https://missingbenefit.com) (UK), built by [Tom Loosemore](https://govservicedesign.net/keynotes/tom-loosemore).

## Programs Covered

| Program | Agency | Key Criteria |
|---------|--------|-------------|
| SNAP (food assistance) | DC DHS | Income ≤ 200% FPL (gross) |
| Medicaid / DC Healthcare Alliance | DHCF | Income ≤ 215% FPL (adults) |
| TANF (cash assistance) | DC DHS | Dependent children, very low income |
| DC EITC | OTR | Working, income limits by family size |
| DC Paid Family Leave | DOES | DC-covered employer |
| Unemployment Insurance | DOES | Involuntary job loss |
| LIHEAP (energy assistance) | DOEE | Income ≤ 60% SMI |
| WIC | DC Health | Pregnant/postpartum/children under 5 |
| Child Care Subsidy | OSSE | Working/student, children under 13 |
| Property Tax Relief | OTR | Homeowners and renters |
| SSI | SSA | Age 65+ or disabled |
| IDA | DC DHS | Disabled, awaiting SSI |
| Free/Reduced School Meals | OSSE | School-age children |
| Kids Ride Free | DDOT | Students ages 5-21 |

## Architecture

```
┌──────────────────────────────────────────────┐
│  FRONTEND (Static)                           │
│  S3 + CloudFront                             │
│  React SPA: questionnaire, results, chat UI  │
│  Eligibility engine runs in-browser (JS)     │
└──────────────┬───────────────────────────────┘
               │ POST /chat
               ▼
┌──────────────────────────────────────────────┐
│  API GATEWAY → LAMBDA (Python)               │
│  1. Embed question (Bedrock Titan)           │
│  2. Retrieve from FAISS vector index         │
│  3. Generate answer (Bedrock Claude Haiku)   │
│  4. Return answer + source citations         │
└──────────────────────────────────────────────┘
```

**Cost:** < $5/month at low traffic. Hard cap at $10/month via AWS Budgets.

## Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev      # http://localhost:5173

# Build
npm run build    # Output in frontend/dist/
```

## Deployment

```bash
# 1. Build frontend
cd frontend && npm run build

# 2. Build RAG corpus (requires AWS credentials with Bedrock access)
cd backend/scripts
pip install requests beautifulsoup4 boto3 faiss-cpu numpy
python build_corpus.py
python build_embeddings.py

# 3. Deploy infrastructure
cd infrastructure
sam build && sam deploy --guided

# 4. Upload frontend to S3
aws s3 sync frontend/dist/ s3://YOUR_BUCKET --delete
```

## Updating Benefit Thresholds

Annual updates needed (all in `frontend/src/engine/data/`):

- **January:** [Federal Poverty Guidelines](https://aspe.hhs.gov/poverty-guidelines) → `fpl.ts`
- **October:** [SNAP allotments](https://www.fns.usda.gov/snap/allotment) → `snap.ts`
- **Per tax year:** [DC EITC match rate](https://otr.cfo.dc.gov/page/dc-eitc) → `programs/eitc.ts`
- **Annually:** TANF, LIHEAP, Paid Family Leave, UI, property tax thresholds

## Project Structure

```
├── frontend/           # React SPA (Vite + TypeScript)
│   └── src/
│       ├── engine/     # Eligibility logic (pure TS, no React deps)
│       │   ├── programs/  # One file per benefit program
│       │   └── data/      # FPL tables, SNAP thresholds
│       └── components/ # React UI components
├── backend/            # Lambda + RAG pipeline
│   ├── lambda/         # Chat handler + RAG engine
│   ├── corpus/         # Source docs, chunks, FAISS index
│   └── scripts/        # Corpus builder, embedding generator
├── infrastructure/     # SAM/CloudFormation templates
├── tests/              # Engine + RAG tests
└── docs/               # Architecture, sources, Substack draft
```

## License

MIT

## Author

[Max Greenberg](https://www.linkedin.com/in/maxwellgreenberg) — [Maxwell.greenberg@gmail.com](mailto:Maxwell.greenberg@gmail.com)
