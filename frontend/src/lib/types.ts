export interface User {
  id: string;
  name: string;
  role: string;
  department: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  conditions: string[];
  notes: string;
}

export interface ConflictInfo {
  node_id: string;
  title: string;
  content: string;
  type: string;
  similarity: number;
  conflict_type: "DUPLICATE" | "UPDATE" | "COEXIST" | "NEW";
}

export interface Candidate {
  id: string;
  type: "CONSTRAINT" | "DECISION" | "ANTI_PATTERN" | "FACT";
  title: string;
  content: string;
  importance: number;
  confidence: number;
  routing_tier: "HIGH" | "MEDIUM" | "LOW";
  suggested_level: string;
  department: string | null;
  rationale: string;
  conflict_type: string;
  conflict_node_id: string | null;
  conflict_similarity: number | null;
  conflicts: ConflictInfo[];
  // UI state
  actionDone?: boolean;
  actionResult?: string;
}
