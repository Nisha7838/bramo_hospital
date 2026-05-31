"use client";
import { useState, useRef } from "react";

interface Props {
  onConfirm: (transcript: string) => void;
  loading: boolean;
}

const SAMPLE_TRANSCRIPTS = [
  {
    label: "Dr. Sharma + Ramaiah (Telugu-English)",
    text: "Ramaiah gari ki molli noppi undi, Ibuprofen adugutunnaru, stent valla ivvaledu, Paracetamol continue cheyandi, Tramadol try cheddham, dizziness monitor cheyali.",
  },
  {
    label: "Aadhya - Penicillin Case (Surprise)",
    text: "Patient Aadhya, 3.5 years, penicillin allergy confirmed - anaphylaxis at 18 months. Mother requesting amoxicillin for ear infection. Prescribed azithromycin instead. Document this - remind ALL doctors about the allergy. Also note: this is her 5th ear infection this year, consider ENT referral.",
  },
  {
    label: "Empty Session (Edge Case)",
    text: "Ramaiah is doing well today. No changes to medications. Follow up in 2 weeks.",
  },
];

export default function TranscriptInput({ onConfirm, loading }: Props) {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState("en-IN");
  const recognitionRef = useRef<any>(null);

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recording sirf Chrome browser mein kaam karta hai. Chrome mein kholo.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let final = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
      }
      if (final) setTranscript((p) => p + final);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Step 1: Input Transcript</h2>

      {/* Sample Transcripts */}
      <div className="flex flex-wrap gap-2">
        {SAMPLE_TRANSCRIPTS.map((s) => (
          <button
            key={s.label}
            onClick={() => setTranscript(s.text)}
            className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={5}
        placeholder="Paste transcript here OR click a sample above OR use mic button..."
        className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* Mic + Confirm */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          disabled={listening}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white"
        >
          <option value="en-IN">English (India)</option>
          <option value="hi-IN">Hindi</option>
          <option value="te-IN">Telugu</option>
          <option value="ta-IN">Tamil</option>
          <option value="en-US">English (US)</option>
        </select>
        <button
          onClick={listening ? stopListening : startListening}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
            listening
              ? "bg-red-100 text-red-700 border border-red-300 animate-pulse"
              : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
          }`}
        >
          🎤 {listening ? "Stop Recording" : "Record Voice"}
        </button>

        <button
          onClick={() => transcript.trim() && onConfirm(transcript.trim())}
          disabled={!transcript.trim() || loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2 px-6 rounded-xl transition-all text-sm"
        >
          {loading ? "Extracting..." : "✓ Confirm & Extract Knowledge"}
        </button>

        {transcript && (
          <button
            onClick={() => setTranscript("")}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
        ⚠️ Review transcript for accuracy before extraction. Medical terms may be transcribed
        incorrectly. Edit above if needed.
      </p>
    </div>
  );
}
