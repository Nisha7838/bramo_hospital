"use client";
import { Candidate } from "@/lib/types";

interface Props {
  candidates: Candidate[];
  actionMap: Record<string, string>;
}

export default function CapturesSummary({ candidates, actionMap }: Props) {
  if (candidates.length === 0) return null;

  const auto      = candidates.filter((c) => c.routing_tier === "HIGH").length;
  const review    = candidates.filter((c) => c.routing_tier === "MEDIUM").length;
  const explicit  = candidates.filter((c) => c.routing_tier === "LOW").length;
  const confirmed = Object.values(actionMap).filter((v) => v === "CONFIRMED" || v === "AUTO_CAPTURED").length;
  const merged    = Object.values(actionMap).filter((v) => v === "MERGED").length;
  const dismissed = Object.values(actionMap).filter((v) => v === "DISMISSED").length;
  const conflicts = candidates.filter((c) => c.conflicts?.length > 0).length;
  const duplicates = candidates.filter((c) => c.conflict_type === "DUPLICATE").length;
  const updates    = candidates.filter((c) => c.conflict_type === "UPDATE").length;

  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <h3 className="font-semibold text-gray-700 mb-3">📊 Session Summary</h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Auto-captured" value={auto} color="green" />
        <Stat label="Needs review" value={review} color="yellow" />
        <Stat label="Needs input" value={explicit} color="red" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Confirmed" value={confirmed} color="blue" />
        <Stat label="Merged" value={merged} color="purple" />
        <Stat label="Dismissed" value={dismissed} color="gray" />
      </div>

      {conflicts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
          <p className="font-semibold text-amber-700 mb-1">Conflicts Found: {conflicts}</p>
          <p className="text-amber-600 text-xs">
            {duplicates > 0 && `${duplicates} duplicate(s) detected. `}
            {updates > 0 && `${updates} update suggestion(s). `}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    green:  "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red:    "bg-red-100 text-red-800",
    blue:   "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
    gray:   "bg-gray-100 text-gray-800",
  };
  return (
    <div className={`rounded-xl px-3 py-2 text-center ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );
}
