import { describe, expect, it } from "vitest";
import { mapMetricTrendToArrow } from "@/features/weekly-report/services/weekly-report-builder";

describe("weekly report helpers", () => {
  it("maps trends to arrows", () => {
    expect(mapMetricTrendToArrow("up")).toBe("↑");
    expect(mapMetricTrendToArrow("down")).toBe("↓");
    expect(mapMetricTrendToArrow("flat")).toBe("→");
  });
});

describe("weekly report html", () => {
  it("builds subject with calendar week", async () => {
    const { buildWeeklyReportSubject } = await import(
      "@/features/weekly-report/services/weekly-report-html"
    );
    expect(
      buildWeeklyReportSubject({
        weekNumber: 27,
      } as never)
    ).toBe("[HELPY] Deine HELPY Wochenzusammenfassung – KW 27");
  });
});

describe("weekly report send window", () => {
  it("matches Monday 05:30 Europe/Zurich", async () => {
    const { isWeeklyReportSendWindow } = await import(
      "@/lib/datetime/timezone-week"
    );

    const mondayZurich530 = new Date("2026-07-06T03:35:00.000Z");
    expect(isWeeklyReportSendWindow(mondayZurich530, "Europe/Zurich")).toBe(
      true
    );

    const mondayZurichNoon = new Date("2026-07-06T10:00:00.000Z");
    expect(isWeeklyReportSendWindow(mondayZurichNoon, "Europe/Zurich")).toBe(
      false
    );
  });
});
