"use client";

import { useState } from "react";
import { Loader2, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import { VoiceAppointmentSlots } from "@/features/voice/components/voice-appointment-slots";
import {
  finalizeVoiceIntakeWithCalendar,
  isVoiceAppointmentIntent,
} from "@/features/voice/voice-calendar";
import { runMockConversation } from "@/features/voice/voice-core";
import { saveVoiceMemory } from "@/features/voice/voice-memory";
import { ingestVoiceProcessedCall } from "@/features/voice/services/voice-vorgaenge-store";
import type { VoiceIntent } from "@/features/voice/types/voice-types";

const SAMPLES = [
  {
    label: "Besichtigung",
    text: "Guten Tag, ich interessiere mich für die 4.5-Zimmer-Wohnung in Zürich. Können wir einen Besichtigungstermin vereinbaren?",
    callerName: "Anna Müller",
    callerPhone: "+41 79 123 45 67",
  },
  {
    label: "Termin morgen",
    text: "Hallo, können wir morgen um 14 Uhr einen Besichtigungstermin vereinbaren?",
    callerName: "Sandra Brunner",
    callerPhone: "+41 78 555 66 77",
  },
  {
    label: "Rückruf",
    text: "Hallo, bitte rufen Sie mich zurück wegen der Offerte.",
    callerName: "Peter Keller",
    callerPhone: "+41 44 555 12 34",
  },
];

export function VoiceMockPanel() {
  const { activeSkill } = useActiveSkill();
  const [transcript, setTranscript] = useState(SAMPLES[0].text);
  const [callerName, setCallerName] = useState(SAMPLES[0].callerName);
  const [callerPhone, setCallerPhone] = useState(SAMPLES[0].callerPhone);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [lastVorgangId, setLastVorgangId] = useState<string | null>(null);
  const [showSlots, setShowSlots] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    setMessage(null);
    setLastReply(null);
    setShowSlots(false);

    try {
      const { turn, end, processed } = await runMockConversation({
        transcript,
        callerName,
        callerPhone,
        skill: activeSkill,
      });

      saveVoiceMemory({
        conversationId: end.conversation.conversationId,
        callId: end.conversation.callId,
        vorgangId: end.vorgangId,
        skill: activeSkill,
        transcript,
        summary: processed.call.summary ?? "",
        intent: turn.intent,
        intentLabel: turn.intentLabel,
        callerName,
        callerPhone,
        nextAction: processed.liste.recommendedNextStep,
      });

      let ingested = ingestVoiceProcessedCall(processed);
      if (isVoiceAppointmentIntent(turn.intent as VoiceIntent)) {
        ingested = await finalizeVoiceIntakeWithCalendar(ingested, transcript);
        ingestVoiceProcessedCall(ingested);
        setShowSlots(true);
      }

      setLastVorgangId(ingested.vorgangId);
      setLastReply(turn.assistantReply);
      setMessage("Mock-Gespräch abgeschlossen. Memory, Workflow und Vorgang wurden erstellt.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mock fehlgeschlagen.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <h2 className="text-[15px] font-semibold text-[#0F172A]">Mock Gespräch simulieren</h2>
      <p className="mt-1 text-[12px] text-[#64748B]">
        Text eingeben → Voice Core → Brain → Memory → Workflow. Kein Telefonanbieter nötig.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {SAMPLES.map((sample) => (
          <button
            key={sample.label}
            type="button"
            className="rounded-full border border-[#E2E8F0] px-3 py-1 text-[11px] font-medium text-[#475569] hover:border-[#2563EB]/40"
            onClick={() => {
              setTranscript(sample.text);
              setCallerName(sample.callerName);
              setCallerPhone(sample.callerPhone);
            }}
          >
            {sample.label}
          </button>
        ))}
      </div>

      <Textarea
        className="mt-3 min-h-[96px] text-[13px]"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Was der Anrufer sagt …"
      />

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input
          className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-[12px]"
          value={callerName}
          onChange={(e) => setCallerName(e.target.value)}
          placeholder="Name"
        />
        <input
          className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-[12px]"
          value={callerPhone}
          onChange={(e) => setCallerPhone(e.target.value)}
          placeholder="Telefon"
        />
      </div>

      <Button type="button" size="sm" className="mt-4" disabled={running} onClick={() => void handleRun()}>
        {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
        Mock-Gespräch starten
      </Button>

      {lastReply && (
        <div className="mt-4 flex gap-2 rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-[12px] text-[#1D4ED8]">
          <Volume2 className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>HELPY:</strong> {lastReply}
          </p>
        </div>
      )}

      {showSlots && lastVorgangId && (
        <div className="mt-4">
          <VoiceAppointmentSlots vorgangId={lastVorgangId} onConfirmed={setMessage} />
        </div>
      )}

      {message && (
        <p className="mt-4 rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-[12px] text-[#1D4ED8]">
          {message}
          {lastVorgangId && (
            <>
              {" "}
              <a href={`/workspace/${lastVorgangId}`} className="font-semibold underline">
                Vorgang öffnen
              </a>
            </>
          )}
        </p>
      )}
    </section>
  );
}
