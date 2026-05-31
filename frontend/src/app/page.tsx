"use client";
import { useState, useEffect } from "react";
import { getUsers, getPatients, extractKnowledge } from "@/lib/api";
import { User, Patient, Candidate } from "@/lib/types";
import TranscriptInput from "@/components/TranscriptInput";
import AutoCaptureCard from "@/components/AutoCaptureCard";
import ReviewCard from "@/components/ReviewCard";
import ExplicitInputCard from "@/components/ExplicitInputCard";
import CapturesSummary from "@/components/CapturesSummary";

export default function Home() {
  const [users, setUsers]         = useState<User[]>([]);
  const [patients, setPatients]   = useState<Patient[]>([]);
  const [userId, setUserId]       = useState("");
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading]     = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [actionMap, setActionMap]   = useState<Record<string, string>>({});
  const [error, setError]           = useState("");
  const [extracted, setExtracted]   = useState(false);

  useEffect(() => {
    getUsers().then((u) => { setUsers(u); if (u.length) setUserId(u[0].id); });
    getPatients().then((p) => { setPatients(p); if (p.length) setPatientId(p[0].id); });
  }, []);

  const selectedUser    = users.find((u) => u.id === userId);
  const selectedPatient = patients.find((p) => p.id === patientId);

  async function handleExtract(transcript: string) {
    if (!userId || !patientId) { setError("Select doctor and patient first"); return; }
    setLoading(true);
    setError("");
    setCandidates([]);
    setActionMap({});
    setExtracted(false);
    try {
      const res = await extractKnowledge({ transcript, patient_id: patientId, user_id: userId });
      setCandidates(res.candidates || []);
      setExtracted(true);
    } catch (e: any) {
      setError(e.message || "Extraction failed");
    } finally {
      setLoading(false);
    }
  }

  function markDone(id: string, result: string) {
    setActionMap((prev) => ({ ...prev, [id]: result }));
  }

  const highTier   = candidates.filter((c) => c.routing_tier === "HIGH");
  const medTier    = candidates.filter((c) => c.routing_tier === "MEDIUM");
  const lowTier    = candidates.filter((c) => c.routing_tier === "LOW");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-blue-900">BRAHMO Capture</h1>
          <p className="text-gray-500 text-sm">Voice → Knowledge Extraction → Conflict Detection</p>
        </div>

        {/* Doctor + Patient Selector */}
        <div className="bg-white rounded-2xl shadow-md p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Doctor</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            {selectedUser && (
              <p className="text-xs text-gray-400 mt-1">{selectedUser.role} · {selectedUser.department}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedPatient && (
              <p className="text-xs text-gray-400 mt-1">
                {selectedPatient.age}{selectedPatient.gender} · {selectedPatient.conditions?.slice(0, 2).join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Transcript Input */}
        <TranscriptInput onConfirm={handleExtract} loading={loading} />

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
            ⚠ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8 text-gray-500">
            <div className="inline-block animate-spin text-3xl mb-2">⚙</div>
            <p className="text-sm">Extracting knowledge from transcript...</p>
          </div>
        )}

        {/* Results */}
        {extracted && !loading && (
          <>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-800">
                Extracted Knowledge — {candidates.length} Candidate{candidates.length !== 1 ? "s" : ""}
              </h2>
              {candidates.length === 0 && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Nothing to capture (ephemeral session)
                </span>
              )}
            </div>

            {/* GREEN tier */}
            {highTier.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                  <span className="text-sm font-semibold text-green-700">
                    AUTO-CAPTURED (confidence &gt; 85%) — {highTier.length}
                  </span>
                </div>
                {highTier.map((c) => (
                  <AutoCaptureCard key={c.id} candidate={c} userId={userId} onDone={markDone} />
                ))}
              </section>
            )}

            {/* YELLOW tier */}
            {medTier.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
                  <span className="text-sm font-semibold text-yellow-700">
                    REVIEW REQUIRED (60–85%) — {medTier.length}
                  </span>
                </div>
                {medTier.map((c) => (
                  <ReviewCard key={c.id} candidate={c} userId={userId} onDone={markDone} />
                ))}
              </section>
            )}

            {/* RED tier */}
            {lowTier.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  <span className="text-sm font-semibold text-red-700">
                    EXPLICIT INPUT REQUIRED (&lt; 60%) — {lowTier.length}
                  </span>
                </div>
                {lowTier.map((c) => (
                  <ExplicitInputCard key={c.id} candidate={c} userId={userId} onDone={markDone} />
                ))}
              </section>
            )}

            {/* Summary */}
            <CapturesSummary candidates={candidates} actionMap={actionMap} />
          </>
        )}
      </div>
    </main>
  );
}
