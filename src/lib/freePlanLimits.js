import { hasPaidAccess } from "../subscriptionAccess";
import { supabase } from "../supabaseClient";

export const FREE_LIMITS = {
  questionPaperDownloadsPerWeek: 2,
  markSchemeDownloadsPerWeek: 2,
  topicTestsPerWeek: 1,
  pdfEditsPerWeek: 2,
  savedPapersTotal: 3,
  pdfExportsPerWeek: 0,
};

export const USAGE_EVENT_TYPES = {
  questionPaperDownload: "question_paper_download",
  markSchemeDownload: "mark_scheme_download",
  topicTestStart: "topic_test_start",
  pdfEditOpen: "pdf_edit_open",
  pdfExport: "pdf_export",
};

export function getStartOfCurrentWeek(now = new Date()) {
  const start = new Date(now);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function countThisWeeksUsage(usageEvents = [], eventType, now = new Date()) {
  const weekStart = getStartOfCurrentWeek(now).getTime();
  return usageEvents.filter((event) => {
    if (event.event_type !== eventType) return false;
    return new Date(event.created_at || 0).getTime() >= weekStart;
  }).length;
}

export function getFreePlanUsage(usageEvents = [], savedPapersTotal = 0, now = new Date()) {
  return {
    questionPaperDownloads: countThisWeeksUsage(
      usageEvents,
      USAGE_EVENT_TYPES.questionPaperDownload,
      now
    ),
    markSchemeDownloads: countThisWeeksUsage(
      usageEvents,
      USAGE_EVENT_TYPES.markSchemeDownload,
      now
    ),
    topicTests: countThisWeeksUsage(usageEvents, USAGE_EVENT_TYPES.topicTestStart, now),
    pdfEdits: countThisWeeksUsage(usageEvents, USAGE_EVENT_TYPES.pdfEditOpen, now),
    pdfExports: countThisWeeksUsage(usageEvents, USAGE_EVENT_TYPES.pdfExport, now),
    savedPapers: savedPapersTotal,
  };
}

export function getFreePlanAccess({
  subscription = null,
  paidAccess = false,
  usageEvents = [],
  savedPapersTotal = 0,
  now = new Date(),
} = {}) {
  const isPaid = Boolean(paidAccess || hasPaidAccess(subscription, now));
  const usage = getFreePlanUsage(usageEvents, savedPapersTotal, now);

  return {
    isPaid,
    isFree: !isPaid,
    limits: FREE_LIMITS,
    usage,
    canDownloadQuestionPaper:
      isPaid || usage.questionPaperDownloads < FREE_LIMITS.questionPaperDownloadsPerWeek,
    canDownloadMarkScheme:
      isPaid || usage.markSchemeDownloads < FREE_LIMITS.markSchemeDownloadsPerWeek,
    canStartTopicTest: isPaid || usage.topicTests < FREE_LIMITS.topicTestsPerWeek,
    canOpenPdfEdit: isPaid || usage.pdfEdits < FREE_LIMITS.pdfEditsPerWeek,
    canSavePaper: isPaid || usage.savedPapers < FREE_LIMITS.savedPapersTotal,
    canExportPdf: isPaid || usage.pdfExports < FREE_LIMITS.pdfExportsPerWeek,
    canUseCalendar: isPaid,
    canUseMistakes: isPaid,
    canUseAiTutor: isPaid,
    canUseGradeBoundaries: isPaid,
  };
}

export async function recordUsageEvent(user, eventType, resource = {}) {
  if (!user?.id) return { data: null, error: new Error("Sign in required.") };

  return supabase
    .from("usage_events")
    .insert({
      user_id: user.id,
      event_type: eventType,
      resource_id: resource.resource_id || resource.id || null,
      resource_label: resource.resource_label || resource.label || null,
    })
    .select()
    .single();
}
