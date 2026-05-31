"use client";
import { useEffect, useState } from "react";
import { Candidate } from "@/lib/types";
import ConflictPanel from "./ConflictPanel";
import { autoCapture, undoCapture, mergeNode } from "@/lib/api";

interface Props {
  candidate: Candidate;
  userId: string;
  onDone: (id: string, result: string) => void;
}

const TYPE_COLOR: Record<string, string> = {
  CONSTRAINT:   "bg-red-100 text-red-800",
  DECISION:     "bg-blue-100 text-blue-800",
  ANTI_PATTERN: "bg-purple-100 text-purple-800",
  FACT:         "bg-gray-100 text-gray-800",
};

export default function AutoCaptureCard({ candidate, userId, onDone }: Props) {
  const [seconds, setSeconds] = useState(60);
  const [done, setDone]       = useState(false);
  const [captured, setCaptured] = useState(false);
  const [nodeId, setNodeId]   = useState<string | null>(null);

  // Auto-capture on mount
  useEffect(() => {
    autoCapture(candidate.id, userId)
      .then((r) => { setNodeId(r.node_id); setCaptured(true); })
      .catch(console.error);
  }, [candidate.id, userId]);

  // Countdown
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(t); setDone(true); onDone(candidate.id, "AUTO_CAPTURED"); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [done]);

  async function handleUndo() {
    await undoCapture(candidate.id, userId);
    setDone(true);
    onDone(candidate.id, "UNDONE");
  }

  async function handleMerge(targetNodeId: string) {
    await mergeNode(candidate.id, targetNodeId, userId);
    setDone(true);
    onDone(candidate.id, "MERGED");
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 opacity-60">
        <p className="text-sm text-green-700 font-medium">✓ Auto-captured {nodeId ? `(Node: ${nodeId})` : ""}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-green-400 bg-green-50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-bold text-sm">🟢 AUTO-CAPTURED</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[candidate.type]}`}>
            {candidate.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Conf: {(candidate.confidence * 100).toFixed(0)}%</span>
          <span className="text-sm font-mono font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-lg">
            {seconds}s undo
          </span>
        </div>
      </div>

      <div>
        <p className="font-semibold text-gray-800 text-sm">{candidate.title}</p>
        <p className="text-sm text-gray-600 mt-1">{candidate.content}</p>
        <p className="text-xs text-gray-400 mt-1">
          Level: {candidate.suggested_level} | Dept: {candidate.department || "—"} | Importance: {candidate.importance}
        </p>
      </div>

      {/* Conflict */}
      {candidate.conflicts?.length > 0 && (
        <ConflictPanel
          conflicts={candidate.conflicts}
          candidateId={candidate.id}
          userId={userId}
          onMerge={handleMerge}
          onKeepBoth={() => {}}
        />
      )}

      {/* Undo */}
      <button
        onClick={handleUndo}
        className="w-full text-center text-sm text-red-600 hover:text-red-800 font-medium py-1 border border-red-200 rounded-xl hover:bg-red-50 transition-all"
      >
        ↩ Undo Auto-Capture
      </button>

      {/* Progress bar */}
      <div className="w-full bg-green-200 rounded-full h-1.5">
        <div
          className="bg-green-500 h-1.5 rounded-full transition-all duration-1000"
          style={{ width: `${(seconds / 60) * 100}%` }}
        />
      </div>
    </div>
  );
}
