import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from capture.extractor import extract_knowledge
from capture.conflict_detector import find_conflicts

transcript = "Ramaiah has knee pain, asking for Ibuprofen, cant give due to stent, continue Paracetamol, try Tramadol, monitor dizziness"
print("Testing extraction...")
candidates = extract_knowledge(transcript, "PAT-RAMAIAH", "supra")
print(f"Got {len(candidates)} candidates\n")

for c in candidates:
    emb = c.get("embedding", [])
    conflicts = find_conflicts(emb, "supra") if emb else []
    tier = c.get("routing_tier", "?")
    print(f"  [{tier}] {c['type']} | {c['title']} | conf:{c['confidence']}")
    if conflicts:
        top = conflicts[0]
        print(f"    Conflict: {top['conflict_type']} {top['similarity']} - {top['title']}")
    else:
        print(f"    Conflict: NEW")

print("\nPipeline test complete!")
