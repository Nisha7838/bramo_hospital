"use client";
import { ConflictInfo } from "@/lib/types";

interface Props {
  conflicts: ConflictInfo[];
  candidateId: string;
  userId: string;
  onMerge: (targetNodeId: string) => void;
  onKeepBoth: () => void;
}

const CONFLICT_COLOR: Record<string, string> = {
  DUPLICATE: "bg-red-50 border-red-300 text-red-800",
  UPDATE:    "bg-orange-50 border-orange-300 text-orange-800",
  COEXIST:   "bg-yellow-50 border-yellow-300 text-yellow-800",
  NEW:       "bg-green-50 border-green-300 text-green-800",
};

const CONFLICT_LABEL: Record<string, string> = {
  DUPLICATE: "DUPLICATE",
  UPDATE:    "UPDATE EXISTING",
  COEXIST:   "COEXIST",
  NEW:       "NEW",
};

export default function ConflictPanel({ conflicts, onMerge, onKeepBoth }: Props) {
  if (!conflicts || conflicts.length === 0) return null;

  const top = conflicts[0];
  const pct = Math.round(top.similarity * 100);

  return (
    <div className={`rounded-xl border p-3 mt-3 text-sm ${CONFLICT_COLOR[top.conflict_type] || "bg-gray-50 border-gray-300"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-xs uppercase tracking-wide">
          ⚠ Conflict: {CONFLICT_LABEL[top.conflict_type]}
        </span>
        <span className="font-mono font-bold text-base">{pct}% match</span>
      </div>

      <div className="mb-2">
        <span className="font-semibold">{top.title}</span>
        <p className="text-xs mt-1 opacity-80 line-clamp-2">{top.content}</p>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {(top.conflict_type === "DUPLICATE" || top.conflict_type === "UPDATE") && (
          <button
            onClick={() => onMerge(top.node_id)}
            className="px-3 py-1 bg-white border border-current rounded-lg text-xs font-medium hover:bg-opacity-80"
          >
            {top.conflict_type === "DUPLICATE" ? "Merge with existing" : "Update existing node"}
          </button>
        )}
        <button
          onClick={onKeepBoth}
          className="px-3 py-1 bg-white border border-current rounded-lg text-xs font-medium hover:bg-opacity-80"
        >
          Keep both
        </button>
      </div>

      {conflicts.length > 1 && (
        <p className="text-xs mt-2 opacity-60">+{conflicts.length - 1} more similar nodes found</p>
      )}
    </div>
  );
}
