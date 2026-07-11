"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MeinArbeitstagPage } from "@/features/brain/components/workday/meinarbeitstag-page";
import { WorkdayHelpyPanel } from "@/features/brain/components/workday/workday-helpy-panel";
import {
  createInitialIntakeState,
  runIntakeProcessor,
  type IntakeFeedback,
  type IntakeState,
} from "@/features/brain/services/intake";
import { generateDailyPlanSync } from "@/features/brain/services/helpy-brain";
import type { DailyPlan } from "@/features/brain/services/helpy-brain/types";
import {
  buildDailyPlanFromWorkdaySummary,
  buildEmptyWorkdaySummary,
  buildWorkdaySummary,
  WORKDAY_METRIC_PLACEHOLDERS,
} from "@/features/workday/services/workday-summary";
import { buildWorkdayCalendarAppointmentsFromState } from "@/features/calendar/services/workday-calendar-appointments";
import { subscribeCalendarPlatform, reconcileCalendarPlatformState, getConnectedCalendarPlatform } from "@/features/calendar/services/calendar-platform";
import {
  getAppleCalendarSyncState,
  isAppleCalendarConnected,
  subscribeAppleCalendarSync,
  syncAppleCalendarEvents,
} from "@/features/apple-calendar/services/apple-calendar-sync";
import {
  buildWorkdayGreeting,
  extractFirstNameFromUser,
  WORKDAY_GREETING_PLACEHOLDER,
} from "@/features/workday/services/workday-greeting";
import {
  WORKFLOW_FEEDBACK_MESSAGES,
  createInitialWorkflowState,
  markWorkflowResultDone,
  markWorkflowResultInProgress,
  runWorkflowEngine,
  type WorkflowEngineState,
  type WorkflowResultActionType,
} from "@/features/workflow/services/engine";
import {
  getAllMailVorgaenge,
  hasMailVorgaenge,
  subscribeAllMailVorgaenge,
} from "@/features/mail";
import { isMailSyncLoading } from "@/features/mail/mail-sync-status";
import {
  loadOutlookVorgaenge,
} from "@/features/outlook/services/outlook-vorgaenge-store";
import { refreshOutlookConnectionStatus } from "@/features/outlook/services/outlook-auth-service";
import { loadGmailVorgaenge } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { resolveGmailSyncContext } from "@/features/mail/services/gmail-sync-context-client";
import { syncGmailViaOAuthApi } from "@/features/oauth/services/oauth-connections-client";
import { syncGmailVorgaengeFromOAuthAccounts } from "@/features/workspace/services/vorgaenge/gmail-oauth-sync";
import { initGmailVorgangStatuses } from "@/features/workspace/services/status";
import { subscribeVorgaengeCounts } from "@/features/workspace/services/vorgaenge/vorgaenge-summary";
import { refreshAllFollowUps } from "@/features/followup/services/followup-engine";
import { ensureCompletedVorgaengeLoaded } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import {
  fetchWorkdayAnalytics,
  syncVorgangEventsForAnalytics,
} from "@/features/analytics/services/workday-analytics-client";
import type { WorkdayAnalytics, WorkdayKpiMetric } from "@/features/analytics/services/workday-analytics";
import { countRemainingWeekCalendarEvents } from "@/features/calendar/services/calendar-events-store";
import { mockCustomers } from "@/features/customers/mock/mock-customers";
import { buildHotLeadItems } from "@/features/lead-scoring/components/hot-leads-section";
import { useLeadScores } from "@/features/lead-scoring/hooks/use-lead-scores";
import { useConfirmedKundenakten } from "@/features/kundenakte/hooks/use-kundenakte";
import { mergeCustomersWithConfirmedKundenakten } from "@/features/kundenakte/services/kundenakte-mapper";
import { createClient } from "@/lib/supabase/client";

const PLACEHOLDER_PLAN: DailyPlan = {
  ...generateDailyPlanSync(),
  greeting: WORKDAY_GREETING_PLACEHOLDER,
  summary: "HELPY lädt deine E-Mail-Vorgänge…",
  statusMetrics: WORKDAY_METRIC_PLACEHOLDERS,
  prioritizedItems: [],
  progressPercent: 0,
  progressMessage: "Daten werden geladen…",
};

export function WorkdayExperience() {
  const [mounted, setMounted] = useState(false);
  const confirmedKundenakten = useConfirmedKundenakten();
  const baseCustomers = useMemo(
    () => mergeCustomersWithConfirmedKundenakten(mockCustomers, confirmedKundenakten),
    [confirmedKundenakten]
  );
  const scoredCustomers = useLeadScores(baseCustomers);
  const hotLeads = useMemo(
    () => buildHotLeadItems(scoredCustomers),
    [scoredCustomers]
  );
  const [mailReady, setMailReady] = useState(false);
  const [mailLoadAttempted, setMailLoadAttempted] = useState(false);
  const [mailRevision, setMailRevision] = useState(0);
  const [countsRevision, setCountsRevision] = useState(0);
  const [plan, setPlan] = useState<DailyPlan>(() => PLACEHOLDER_PLAN);
  const [greeting, setGreeting] = useState(WORKDAY_GREETING_PLACEHOLDER);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [intakeState, setIntakeState] = useState<IntakeState>(
    createInitialIntakeState()
  );
  const [workflowState, setWorkflowState] = useState<WorkflowEngineState>(
    createInitialWorkflowState()
  );
  const [feedback, setFeedback] = useState<IntakeFeedback | null>(null);
  const [workflowFeedback, setWorkflowFeedback] = useState<string | null>(null);
  const [calendarTick, setCalendarTick] = useState(0);
  const [analytics, setAnalytics] = useState<WorkdayAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(
    () => subscribeAppleCalendarSync(() => setCalendarTick((tick) => tick + 1)),
    []
  );

  useEffect(
    () => subscribeCalendarPlatform(() => setCalendarTick((tick) => tick + 1)),
    []
  );

  useEffect(() => {
    if (!mounted) return;
    reconcileCalendarPlatformState();
    if (getConnectedCalendarPlatform() === "apple" && isAppleCalendarConnected()) {
      void syncAppleCalendarEvents();
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    setGreeting(buildWorkdayGreeting(firstName));
  }, [mounted, firstName]);

  useEffect(() => subscribeAllMailVorgaenge(() => setMailRevision((tick) => tick + 1)), []);

  useEffect(
    () => subscribeVorgaengeCounts(() => setCountsRevision((tick) => tick + 1)),
    []
  );

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setMailReady(true);
      return;
    }

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      setFirstName(extractFirstNameFromUser(user));

      await ensureCompletedVorgaengeLoaded(user?.id ?? null);

      const token = session?.provider_token;
      if (token) {
        setMailLoadAttempted(true);
        const gmailContext = await resolveGmailSyncContext(session.user?.email ?? null);
        await loadGmailVorgaenge(token, gmailContext);
      }

      try {
        const payload = await syncGmailViaOAuthApi();
        if (payload.accounts.length > 0) {
          setMailLoadAttempted(true);
          await syncGmailVorgaengeFromOAuthAccounts(payload.accounts);
        }
      } catch {
        // OAuth-Sync optional
      }

      const outlookStatus = await refreshOutlookConnectionStatus();
      if (outlookStatus.status === "connected") {
        setMailLoadAttempted(true);
        await loadOutlookVorgaenge();
      }

      setMailReady(true);
    });
  }, []);

  const isMailLoading =
    mounted && (!mailReady || isMailSyncLoading());

  const mailVorgaenge = useMemo(() => {
    if (!mounted || !mailReady) return [];
    return getAllMailVorgaenge();
  }, [mounted, mailReady, mailRevision, countsRevision]);

  const useMailSource = mounted && mailReady && mailVorgaenge.length > 0;
  const showMailEmptyState =
    mounted && mailReady && mailLoadAttempted && mailVorgaenge.length === 0;

  const workdaySummary = useMemo(() => {
    if (!mounted || !mailReady) return null;
    if (mailVorgaenge.length > 0) {
      return buildWorkdaySummary(mailVorgaenge);
    }
    if (mailLoadAttempted) {
      return buildEmptyWorkdaySummary();
    }
    return null;
  }, [mounted, mailReady, mailLoadAttempted, mailVorgaenge, mailRevision, countsRevision]);

  const calendarPlatform = useMemo(() => {
    if (!mounted) return null;
    return getConnectedCalendarPlatform();
  }, [mounted, calendarTick]);

  const extraAnalyticsKpis = useMemo((): WorkdayKpiMetric[] => {
    if (!mounted || !calendarPlatform) return [];

    const count = countRemainingWeekCalendarEvents();
    const hasServerUpcoming = analytics?.kpis.some(
      (metric) => metric.id === "appointments-upcoming"
    );
    if (hasServerUpcoming) return [];

    return [
      {
        id: "calendar-upcoming",
        label: "Termine noch diese Woche",
        current: count,
        previous: 0,
        changePercent: 0,
        trend: "flat",
        sparkline: [0, 0, 0, 0, 0, 0, 0],
        mode: "snapshot",
        snapshotHint:
          calendarPlatform === "apple"
            ? "Aus Apple Kalender"
            : "Aus Google Kalender",
      },
    ];
  }, [mounted, calendarPlatform, calendarTick, analytics]);

  useEffect(() => {
    if (!mounted || !mailReady) return;

    void (async () => {
      const vorgaenge = getAllMailVorgaenge();

      if (vorgaenge.length > 0) {
        await syncVorgangEventsForAnalytics(vorgaenge);
      } else if (!mailLoadAttempted) {
        return;
      }

      setAnalyticsLoading(true);
      setAnalyticsError(null);

      const result = await fetchWorkdayAnalytics();
      if (!result.ok) {
        setAnalyticsError(result.error);
        setAnalytics(null);
      } else {
        setAnalytics(result.data);
      }

      setAnalyticsLoading(false);
    })();
  }, [mounted, mailReady, mailRevision, countsRevision, mailLoadAttempted]);

  const todayAppointments = useMemo(() => {
    if (!mounted) return [];

    const appleState = getAppleCalendarSyncState();
    const fromCalendar = buildWorkdayCalendarAppointmentsFromState(
      appleState.events
    );
    const fromVorgaenge = workdaySummary?.todayAppointments ?? [];
    const seen = new Set<string>();

    return [...fromVorgaenge, ...fromCalendar].filter((item) => {
      const key = `${item.href}-${item.uhrzeit ?? ""}-${item.titel}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [mounted, calendarTick, workdaySummary]);

  useEffect(() => {
    if (!mounted || !mailReady) return;

    const vorgaenge = getAllMailVorgaenge();
    if (vorgaenge.length > 0) {
      initGmailVorgangStatuses(vorgaenge);
    }

    refreshAllFollowUps();
  }, [mounted, mailReady, mailRevision]);

  useEffect(() => {
    if (!mounted || !mailReady) return;

    if ((useMailSource || showMailEmptyState) && workdaySummary) {
      setPlan(buildDailyPlanFromWorkdaySummary(workdaySummary, firstName));
      return;
    }

    if (!useMailSource && !showMailEmptyState && !isMailSyncLoading()) {
      setPlan({
        ...generateDailyPlanSync(),
        greeting: buildWorkdayGreeting(firstName),
      });
    }
  }, [
    mounted,
    mailReady,
    useMailSource,
    showMailEmptyState,
    workdaySummary,
    mailRevision,
    countsRevision,
    firstName,
  ]);

  useEffect(() => {
    if (hasAutoStarted.current || useMailSource || showMailEmptyState) {
      return;
    }
    hasAutoStarted.current = true;

    void Promise.all([
      runIntakeProcessor({
        detectionDelayMs: 400,
        waitBeforeVorgaengeMs: 2000,
        vorgangRevealDelayMs: 280,
        onUpdate: setIntakeState,
      }),
      runWorkflowEngine({
        stepDelayMs: 280,
        resultRevealDelayMs: 350,
        onUpdate: setWorkflowState,
      }),
    ]).then(() => {
      if (!hasMailVorgaenge() && !showMailEmptyState) {
        setPlan((current) => ({
          ...generateDailyPlanSync(),
          greeting: current.greeting,
        }));
      }
    });
  }, [useMailSource, showMailEmptyState]);

  const handleWorkflowAction = useCallback(
    (workflowId: string, action: WorkflowResultActionType) => {
      setWorkflowFeedback(null);

      if (action === "als_erledigt") {
        setWorkflowState((prev) => ({
          ...prev,
          results: markWorkflowResultDone(prev.results, workflowId),
        }));
        setWorkflowFeedback(WORKFLOW_FEEDBACK_MESSAGES.erledigt);
        return;
      }

      setWorkflowState((prev) => ({
        ...prev,
        results: markWorkflowResultInProgress(prev.results, workflowId),
      }));

      const message =
        action === "offerte_oeffnen"
          ? WORKFLOW_FEEDBACK_MESSAGES.offerte_oeffnet
          : action === "frist_pruefen"
            ? WORKFLOW_FEEDBACK_MESSAGES.frist_geprueft
            : WORKFLOW_FEEDBACK_MESSAGES.vorgang_oeffnet;

      setWorkflowFeedback(message);
    },
    []
  );

  return (
    <DashboardShell
      rightPanel={
        <WorkdayHelpyPanel
          intake={intakeState}
          workflow={workflowState}
          feedback={feedback}
          useMailSource={useMailSource || showMailEmptyState}
          workdaySummary={workdaySummary}
          isMailLoading={isMailLoading}
        />
      }
    >
      <MeinArbeitstagPage
        plan={plan}
        greeting={greeting}
        todayAppointments={todayAppointments}
        calendarPlatform={calendarPlatform}
        isMailLoading={isMailLoading}
        analytics={analytics}
        analyticsLoading={analyticsLoading}
        analyticsError={analyticsError}
        extraAnalyticsKpis={extraAnalyticsKpis}
        hotLeads={hotLeads}
      />
    </DashboardShell>
  );
}
