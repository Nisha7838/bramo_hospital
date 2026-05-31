"""
Run once after loading seed data:
    cd brahmo
    python scripts/generate_embeddings.py
Uses fastembed (local, no API key needed, ~33MB model download on first run)
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import json
from dotenv import load_dotenv
load_dotenv()

from fastembed import TextEmbedding
from db import get_db

print("Loading embedding model (downloads ~33MB on first run)...")
embedding_model = TextEmbedding("BAAI/bge-small-en-v1.5")
print("Model ready.")

def embed(text: str) -> list:
    embeddings = list(embedding_model.embed([text]))
    return embeddings[0].tolist()

conn = get_db()
cur  = conn.cursor(dictionary=True)
cur.execute("SELECT id, title, content FROM knowledge_nodes WHERE embedding IS NULL")
nodes = cur.fetchall()

print(f"\nGenerating embeddings for {len(nodes)} nodes...")
for n in nodes:
    text = f"{n['title']}: {n['content']}"
    emb  = embed(text)
    cur.execute(
        "UPDATE knowledge_nodes SET embedding=%s WHERE id=%s",
        (json.dumps(emb), n["id"])
    )
    print(f"  OK {n['id']} - {n['title'][:50]}")

cur.close()
conn.close()
print(f"\nDone! {len(nodes)} nodes embedded.")
