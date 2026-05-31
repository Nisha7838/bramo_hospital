# BRAHMO Capture Pipeline — Architecture

## Pipeline Flow

```
Voice/Text Input
    ↓  (Human Check #1 — Doctor reviews transcript)
LLM Knowledge Extraction
    ↓
Confidence Routing (3 tiers)
    ↓
MySQL Cosine Similarity Conflict Detection
    ↓  (Human Check #2 — Doctor confirms each node)
knowledge_nodes table
```

## Extraction Prompt Design

The system prompt defines 4 knowledge types with importance ranges and confidence guidance.
The user prompt sends: reviewed transcript + existing patient nodes (to prevent re-extraction).

Key rules enforced via prompt:
- Don't extract general medical knowledge (textbook facts)
- Don't re-extract what already exists in patient context
- Confidence must vary per candidate

## Confidence Tiers

| Tier | Range | UX |
|------|-------|----|
| HIGH | > 0.85 | Auto-capture with 60s undo timer |
| MEDIUM | 0.60–0.85 | Review card: Confirm / Edit / Dismiss |
| LOW | < 0.60 | Editable form: doctor must type before saving |

## Conflict Detection (Cosine Similarity in Python)

Embeddings stored as JSON in MySQL. Similarity computed via numpy on all active nodes.
Thresholds:

| Similarity | Type | Action |
|------------|------|--------|
| > 0.95 | DUPLICATE | Suggest merge |
| 0.85–0.95 | UPDATE | Suggest enrichment |
| 0.70–0.85 | COEXIST | Keep both |
| < 0.70 | NEW | No conflict |

Performance: 20 nodes → <5ms. 1000 nodes → <50ms. At 10,000+ nodes, move to MySQL vector
search or a dedicated vector DB (Qdrant/Chroma).

## Human-in-the-Loop Points

1. **Transcript Review**: Doctor edits transcript before extraction. Wrong transcription = wrong node.
2. **Node Confirmation**: Each candidate routed by confidence. Auto-captures have undo window.
   Dismissed candidates are LOGGED to event_log (audit trail).

## Tech Stack

- Backend: FastAPI (Python)
- Database: MySQL 8.0 (embeddings stored as JSON)
- Embeddings: OpenAI text-embedding-3-small (1536 dims)
- LLM: GPT-4o-mini
- Frontend: Next.js 14 + Tailwind CSS
