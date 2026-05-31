"use client";
import { useState } from "react";
import { Candidate } from "@/lib/types";
import ConflictPanel from "./ConflictPanel";
import { confirmNode, dismissCandidate, mergeNode } from "@/lib/api";

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

const TYPES = ["CONSTRAINT", "DECISION", "ANTI_PATTERN", "FACT"];
const LEVELS = ["patient", "department", "hospital"];

export default function ReviewCard({ candidate, userId, onDone }: Props) {
  const [editing, setEditing]   = useState(false);
  const [content, setContent]   = useState(candidate.content);
  const [ctype, setCtype]       = useState(candidate.type);
  const [level, setLevel]       = useState(candidate.suggested_level);
  const [dismissReason, setDismissReason] = useState("");
  const [showDismiss, setShowDismiss]     = useState(false);
  const [done, setDone]         = useState(false);
  const [result, setResult]     = useState("");

  async function handleConfirm() {
    await confirmNode({
      candidate_id: candidate.id,
      content,
      type: ctype,
      suggested_level: level,
      department: candidate.department || undefined,
      user_id: userId,
    });
    setResult("CONFIRMED");
    setDone(true);
    onDone(candidate.id, "CONFIRMED");
  }

  async function handleDismiss() {
    if (!dismissReason.trim()) return;
    await dismissCandidate(candidate.id, dismissReason, userId);
    setResult("DISMISSED");
    setDone(true);
    onDone(candidate.id, "DISMISSED");
  }

  async function handleMerge(targetNodeId: string) {
    await mergeNode(candidate.id, targetNodeId, userId);
    setResult("MERGED");
    setDone(true);
    onDone(candidate.id, "MERGED");
  }

  if (done) {
    return (
      <div className={`rounded-2xl border p-4 opacity-60 ${result === "CONFIRMED" ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-gray-50"}`}>
        <p className="text-sm font-medium text-gray-600">
          {result === "CONFIRMED" ? "✓ Confirmed" : result === "DISMISSED" ? "✗ Dismissed" : "↔ Merged"}
          {" — "}{candidate.title}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 font-bold text-sm">🟡 REVIEW REQUIRED</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[candidate.type]}`}>
            {candidate.type}
          </span>
        </div>
        <span className="text-xs text-gray-500">Conf: {(candidate.confidence * 100).toFixed(0)}%</span>
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full border border-yellow-300 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <div className="flex gap-2">
            <select
              value={ctype}
              onChange={(e) => setCtype(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
            >
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
            >
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-800">Done</button>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-semibold text-gray-800 text-sm">{candidate.title}</p>
          <p className="text-sm text-gray-600 mt-1">{content}</p>
          <p className="text-xs text-gray-400 mt-1">
            Level: {level} | Dept: {candidate.department || "—"} | Importance: {candidate.importance}
          </p>
          <p className="text-xs text-gray-400 italic mt-1">{candidate.rationale}</p>
        </div>
      )}

      {/* Conflict panel */}
      {candidate.conflicts?.length > 0 && (
        <ConflictPanel
          conflicts={candidate.conflicts}
          candidateId={candidate.id}
          userId={userId}
          onMerge={handleMerge}
          onKeepBoth={handleConfirm}
        />
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-xl text-sm transition-all"
        >
          ✓ Confirm
        </button>
        <button
          onClick={() => setEditing(!editing)}
          className="px-4 py-2 bg-white border border-yellow-400 text-yellow-700 rounded-xl text-sm hover:bg-yellow-100"
        >
          ✏ Edit
        </button>
        <button
          onClick={() => setShowDismiss(!showDismiss)}
          className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-xl text-sm hover:bg-red-50"
        >
          ✕ Dismiss
        </button>
      </div>

      {/* Dismiss reason */}
      {showDismiss && (
        <div className="flex gap-2">
          <input
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            placeholder="Reason for dismissal..."
            className="flex-1 border border-red-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          />
          <button
            onClick={handleDismiss}
            disabled={!dismissReason.trim()}
            className="px-4 py-1.5 bg-red-500 disabled:bg-gray-300 text-white rounded-xl text-sm"
          >
            Confirm Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
