# BRAHMO Capture Pipeline
Voice → Knowledge Extraction → Conflict Detection

## Quick Start

### 1. Database Setup
```bash
mysql -u root -p < sql/schema.sql
mysql -u root -p < sql/seed.sql
```

### 2. Environment
```bash
cp .env.example .env
# Fill in: MYSQL_PASSWORD, LLM_API_KEY
```

### 3. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

### 4. Generate Embeddings (run once)
```bash
cd ..
python scripts/generate_embeddings.py
# Verify: should print "20 nodes embedded"
```

### 5. Start Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 6. Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

## Test Transcripts

**Transcript 1 (Primary demo — Telugu-English):**
```
Ramaiah gari ki molli noppi undi, Ibuprofen adugutunnaru, stent valla
ivvaledu, Paracetamol continue cheyandi, Tramadol try cheddham,
dizziness monitor cheyali.
```
Expected: 4 candidates, DUPLICATE conflict on N-045, UPDATE on N-089.

**Transcript 2 (Surprise test — Aadhya):**
```
Patient Aadhya, 3.5 years, penicillin allergy confirmed - anaphylaxis
at 18 months. Mother requesting amoxicillin for ear infection.
Prescribed azithromycin. Remind ALL doctors about the allergy.
5th ear infection this year, consider ENT referral.
```

**Transcript 3 (Edge case — empty session):**
```
Ramaiah is doing well today. No changes to medications. Follow up in 2 weeks.
```
Expected: 0–1 candidates.

## Stack
- Backend: FastAPI + Python
- Database: MySQL 8.0 (embeddings as JSON)
- LLM: GPT-4o-mini (OpenAI)
- Embeddings: text-embedding-3-small
- Similarity: numpy cosine similarity
- Frontend: Next.js 14 + Tailwind CSS
