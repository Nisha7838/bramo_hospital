VALID_TYPES = {"CONSTRAINT", "DECISION", "ANTI_PATTERN", "FACT"}
TYPE_FALLBACK = {
    "REINFORCEMENT": "CONSTRAINT",
    "OBSERVATION":   "FACT",
    "PROTOCOL":      "CONSTRAINT",
    "BEHAVIOR":      "FACT",
    "NOTE":          "FACT",
}

def get_routing_tier(confidence: float) -> str:
    if confidence > 0.85:
        return "HIGH"
    elif confidence >= 0.60:
        return "MEDIUM"
    else:
        return "LOW"

def normalize_type(t: str) -> str:
    t = (t or "FACT").upper().replace(" ", "_")
    if t in VALID_TYPES:
        return t
    return TYPE_FALLBACK.get(t, "FACT")

def route_candidates(candidates: list) -> list:
    for c in candidates:
        c["routing_tier"] = get_routing_tier(c.get("confidence", 0.5))
        c["type"] = normalize_type(c.get("type", "FACT"))
    return candidates
