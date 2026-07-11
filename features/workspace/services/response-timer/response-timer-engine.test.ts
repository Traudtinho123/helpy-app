/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import {
  computeHelpyPanelWaitHint,
  computeResponseTimerState,
  formatGermanResponseTime,
} from "@/features/workspace/services/response-timer/response-timer-engine";
import { RESPONSE_TIMER_THRESHOLDS_MS } from "@/features/workspace/services/response-timer/response-timer-config";

describe("response timer engine", () => {
  const receivedAt = "2026-07-11T08:00:00.000Z";

  it("zeigt grünen Status unter 1 Stunde", () => {
    const now = Date.parse(receivedAt) + 23 * 60 * 1000;
    const state = computeResponseTimerState({
      receivedAt,
      isCompleted: false,
      now,
    });

    expect(state?.urgency).toBe("fresh");
    expect(state?.primaryLabel).toContain("23 Minuten");
    expect(state?.compactLabel).toBe("23m");
  });

  it("wechselt auf gelb nach 1 Stunde", () => {
    const now = Date.parse(receivedAt) + RESPONSE_TIMER_THRESHOLDS_MS.yellow + 1000;
    const state = computeResponseTimerState({
      receivedAt,
      isCompleted: false,
      now,
    });

    expect(state?.urgency).toBe("yellow");
    expect(state?.hint).toContain("Schnelle Antwort empfohlen");
  });

  it("zeigt Reaktionszeit für erledigte Vorgänge", () => {
    const completedAt = new Date(
      Date.parse(receivedAt) + 2 * 60 * 60 * 1000 + 14 * 60 * 1000
    ).toISOString();

    const state = computeResponseTimerState({
      receivedAt,
      completedAt,
      isCompleted: true,
      now: Date.parse(completedAt),
    });

    expect(state?.urgency).toBe("completed");
    expect(state?.primaryLabel).toContain("Beantwortet in");
    expect(state?.responseTimeLabel).toBe(
      formatGermanResponseTime(2 * 60 * 60 * 1000 + 14 * 60 * 1000)
    );
  });

  it("formatiert HELPY-Panel-Hinweis nach Wartezeit", () => {
    const now = Date.parse(receivedAt) + 2 * 60 * 60 * 1000;
    const hint = computeHelpyPanelWaitHint({
      receivedAt,
      isCompleted: false,
      now,
    });

    expect(hint?.primaryLine).toBe(
      "Diese Anfrage ist vor 2 Stunden eingegangen."
    );
    expect(hint?.textClassName).toContain("B45309");
    expect(hint?.secondaryLine).toBeUndefined();
  });

  it("zeigt Empfehlung ab 24 Stunden", () => {
    const now = Date.parse(receivedAt) + 25 * 60 * 60 * 1000;
    const hint = computeHelpyPanelWaitHint({
      receivedAt,
      isCompleted: false,
      now,
    });

    expect(hint?.secondaryLine).toBe("Schnelle Antwort wird empfohlen.");
    expect(hint?.textClassName).toContain("DC2626");
  });

  it("blendet Hinweis bei erledigten Vorgängen aus", () => {
    expect(
      computeHelpyPanelWaitHint({
        receivedAt,
        completedAt: receivedAt,
        isCompleted: true,
      })
    ).toBeNull();
  });
});
