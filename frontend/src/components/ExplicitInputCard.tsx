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

const TYPES = ["CONSTRAINT", "DECISION", "ANTI_PATTERN", "FACT"];
const LEVELS = ["patient", "department", "hospital"];

export default function ExplicitInputCard({ candidate, userId, onDone }: Props) {
  const [content, setContent] = useState(candidate.content);
  const [ctype, setCtype]     = useState(candidate.type);
  const [level, setLevel]     = useState(candidate.suggested_level);
  const [done, setDone]       = useState(false);
  const [result, setResult]   = useState("");
  const [dismissReason, setDismissReason] = useState("");
  const [showDismiss, setShowDismiss]     = useState(false);

  async function handleSave() {
    if (!content.trim()) return;
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
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 opacity-60">
        <p className="text-sm font-medium text-gray-600">
          {result === "CONFIRMED" ? "✓ Saved" : result === "DISMISSED" ? "✗ Dismissed" : "↔ Merged"}
          {" — "}{candidate.title}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-bold text-sm">🔴 EXPLICIT INPUT REQUIRED</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
            {candidate.type}
          </span>
        </div>
        <span className="text-xs text-gray-500">Conf: {(candidate.confidence * 100).toFixed(0)}%</span>
      </div>

      <p className="text-xs text-red-600 font-medium">
        ⬇ Low confidence — please review and edit the content below before saving:
      </p>

      {/* Suggested (read-only) */}
      <div className="bg-white border border-red-200 rounded-xl p-2 text-xs text-gray-500">
        <span className="font-semibold">AI suggestion:</span> {candidate.content}
      </div>

      {/* Editable content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Edit or rewrite the knowledge statement..."
        className="w-full border-2 border-red-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
      />

      {/* Type + Level selectors */}
      <div className="flex gap-2 flex-wrap">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Type</label>
          <select
            value={ctype}
            onChange={(e) => setCtype(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          >
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          >
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Conflict */}
      {candidate.conflicts?.length > 0 && (
        <ConflictPanel
          conflicts={candidate.conflicts}
          candidateId={candidate.id}
          userId={userId}
          onMerge={handleMerge}
          onKeepBoth={handleSave}
        />
      )}

      {/* Rationale */}
      <p className="text-xs text-gray-400 italic">{candidate.rationale}</p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!content.trim()}
          className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold py-2 rounded-xl text-sm"
        >
          💾 Save as Node
        </button>
        <button
          onClick={() => setShowDismiss(!showDismiss)}
          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-100"
        >
          ✕ Dismiss
        </button>
      </div>

      {showDismiss && (
        <div className="flex gap-2">
          <input
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            placeholder="Reason for dismissal..."
            className="flex-1 border border-red-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none"
          />
          <button
            onClick={handleDismiss}
            disabled={!dismissReason.trim()}
            className="px-4 py-1.5 bg-red-500 disabled:bg-gray-300 text-white rounded-xl text-sm"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
