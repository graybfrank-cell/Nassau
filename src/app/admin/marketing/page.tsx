"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutGrid,
  Calendar,
  Search,
  Handshake,
  Mail,
  BarChart3,
  Settings,
  Play,
  ExternalLink,
  X,
  ChevronRight,
  AlertCircle,
  Loader2,
  Eye,
  Check,
  Clock,
  Send,
  Plus,
  RefreshCw,
  FileText,
  UserPlus,
  Users,
  Link2,
  Gift,
  Pencil,
} from "lucide-react";

const ADMIN_EMAIL = "graybfrank@gmail.com";

type Tab =
  | "pipeline"
  | "calendar"
  | "scout"
  | "partnerships"
  | "newsletter"
  | "seo"
  | "analytics"
  | "settings";

const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "pipeline", label: "Pipeline", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "scout", label: "Scout", icon: Search },
  { id: "partnerships", label: "Partnerships", icon: Handshake },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "seo", label: "SEO", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const PILLAR_COLORS: Record<string, string> = {
  trip_planning: "bg-blue-100 text-blue-700",
  betting_culture: "bg-purple-100 text-purple-700",
  course_reviews: "bg-amber-100 text-amber-700",
  budget_breakdowns: "bg-emerald-100 text-emerald-700",
  newsletter: "bg-pink-100 text-pink-700",
  general: "bg-zinc-100 text-zinc-700",
};

const STATUS_COLUMNS = [
  "idea",
  "draft",
  "review",
  "approved",
  "scheduled",
  "published",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContentItem = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AlertItem = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PartnershipItem = any;

export default function MarketingDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pipeline");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [content, setContent] = useState<ContentItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [partnerships, setPartnerships] = useState<PartnershipItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plans, setPlans] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [templates, setTemplates] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subscribers, setSubscribers] = useState<any[]>([]);

  // UI state
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [agentRunning, setAgentRunning] = useState<string | null>(null);
  const [writerModal, setWriterModal] = useState(false);
  const [writerForm, setWriterForm] = useState({
    topic: "",
    pillar: "trip_planning",
    format: "all",
    notes: "",
  });

  // Auth check
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/dashboard");
        return;
      }
      setLoading(false);
    });
  }, [router]);

  // Fetch data
  const fetchContent = useCallback(async () => {
    const res = await fetch("/api/admin/marketing/content");
    if (res.ok) setContent(await res.json());
  }, []);

  const fetchAlerts = useCallback(async () => {
    const res = await fetch("/api/admin/marketing/alerts");
    if (res.ok) setAlerts(await res.json());
  }, []);

  const fetchPartnerships = useCallback(async () => {
    const res = await fetch("/api/admin/marketing/partnerships");
    if (res.ok) setPartnerships(await res.json());
  }, []);

  const fetchPlans = useCallback(async () => {
    const res = await fetch("/api/admin/marketing/plans");
    if (res.ok) setPlans(await res.json());
  }, []);

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/admin/marketing/templates");
    if (res.ok) setTemplates(await res.json());
  }, []);

  const fetchSubscribers = useCallback(async () => {
    const res = await fetch("/api/admin/marketing/subscribers");
    if (res.ok) setSubscribers(await res.json());
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchContent();
      fetchAlerts();
      fetchPartnerships();
      fetchPlans();
      fetchTemplates();
      fetchSubscribers();
    }
  }, [loading, fetchContent, fetchAlerts, fetchPartnerships, fetchPlans, fetchTemplates, fetchSubscribers]);

  // Agent runners
  async function runAgent(agent: string, body?: object) {
    setAgentRunning(agent);
    setError(null);
    try {
      const res = await fetch(`/api/admin/marketing/${agent}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Agent ${agent} failed`);
      }
      // Refresh data after agent run
      await Promise.all([fetchContent(), fetchAlerts(), fetchPlans()]);
      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent failed");
      return null;
    } finally {
      setAgentRunning(null);
    }
  }

  async function updateContentStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/marketing/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await fetchContent();
  }

  async function updateAlertStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/marketing/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await fetchAlerts();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              Marketing Command Center
            </h1>
            <p className="text-sm text-zinc-500">Nassau Marketing Agents</p>
          </div>
          <div className="flex items-center gap-2">
            {agentRunning && (
              <span className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Running {agentRunning}...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-auto max-w-7xl px-6 pt-4">
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <nav className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-zinc-500 hover:text-zinc-700"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        {tab === "pipeline" && (
          <PipelineTab
            content={content}
            onSelect={setSelectedContent}
            onStatusChange={updateContentStatus}
            onRunWriter={() => setWriterModal(true)}
            agentRunning={agentRunning}
          />
        )}
        {tab === "calendar" && (
          <CalendarTab
            content={content}
            plans={plans}
            onRunStrategist={() => runAgent("strategist")}
            agentRunning={agentRunning}
          />
        )}
        {tab === "scout" && (
          <ScoutTab
            alerts={alerts}
            onUpdateStatus={updateAlertStatus}
            onRunScout={() => runAgent("scout")}
            onCreateContent={(topic: string) => {
              setWriterForm({ ...writerForm, topic });
              setWriterModal(true);
            }}
            agentRunning={agentRunning}
          />
        )}
        {tab === "partnerships" && (
          <PartnershipsTab
            partnerships={partnerships}
            templates={templates}
            onRunOutreach={(ids: string[]) =>
              runAgent("partnerships", {
                action: "draft_outreach",
                courseIds: ids,
              })
            }
            agentRunning={agentRunning}
            onRefresh={fetchPartnerships}
          />
        )}
        {tab === "newsletter" && (
          <NewsletterTab
            content={content.filter((c: ContentItem) => c.pillar === "newsletter")}
            subscribers={subscribers}
            onRunNewsletter={() => runAgent("newsletter")}
            agentRunning={agentRunning}
          />
        )}
        {tab === "seo" && (
          <SEOTab
            onRunSEOWriter={(keyword: string) => runAgent("seo-writer", { keyword })}
            agentRunning={agentRunning}
          />
        )}
        {tab === "analytics" && (
          <AnalyticsTab
            content={content}
            plans={plans}
            onRunAnalyst={() => runAgent("analyst")}
            agentRunning={agentRunning}
          />
        )}
        {tab === "settings" && (
          <SettingsTab
            onRunOnboarding={() => runAgent("onboarding")}
            onRunReactivation={() => runAgent("reactivation")}
            onRunReferralTracker={() => runAgent("referral-tracker")}
            agentRunning={agentRunning}
          />
        )}
      </div>

      {/* Content Detail Modal */}
      {selectedContent && (
        <ContentModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
          onStatusChange={async (status) => {
            await updateContentStatus(selectedContent.id, status);
            setSelectedContent(null);
          }}
        />
      )}

      {/* Writer Modal */}
      {writerModal && (
        <WriterModal
          form={writerForm}
          onChange={setWriterForm}
          onClose={() => setWriterModal(false)}
          onSubmit={async () => {
            await runAgent("writer", writerForm);
            setWriterModal(false);
            setWriterForm({
              topic: "",
              pillar: "trip_planning",
              format: "all",
              notes: "",
            });
          }}
          running={agentRunning === "writer"}
        />
      )}
    </div>
  );
}

/* ===================== TAB COMPONENTS ===================== */

function PipelineTab({
  content,
  onSelect,
  onStatusChange,
  onRunWriter,
  agentRunning,
}: {
  content: ContentItem[];
  onSelect: (c: ContentItem) => void;
  onStatusChange: (id: string, status: string) => void;
  onRunWriter: () => void;
  agentRunning: string | null;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Content Pipeline</h2>
        <button
          onClick={onRunWriter}
          disabled={agentRunning !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          Run Writer
        </button>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {STATUS_COLUMNS.map((status) => {
          const items = content.filter((c: ContentItem) => c.status === status);
          return (
            <div key={status} className="min-h-[200px]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {status}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((item: ContentItem) => (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md"
                  >
                    <p className="text-sm font-medium text-zinc-900 line-clamp-2">
                      {item.title}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          PILLAR_COLORS[item.pillar] || PILLAR_COLORS.general
                        }`}
                      >
                        {item.pillar}
                      </span>
                      {item.scheduled_platform && (
                        <span className="text-[10px] text-zinc-400">
                          {item.scheduled_platform}
                        </span>
                      )}
                    </div>
                    {item.scheduled_at && (
                      <p className="mt-1 text-[10px] text-zinc-400">
                        {new Date(item.scheduled_at).toLocaleDateString()}
                      </p>
                    )}
                    {/* Quick status buttons */}
                    <div className="mt-2 flex gap-1">
                      {status !== "published" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextStatus =
                              STATUS_COLUMNS[
                                STATUS_COLUMNS.indexOf(status) + 1
                              ];
                            if (nextStatus) onStatusChange(item.id, nextStatus);
                          }}
                          className="rounded px-1.5 py-0.5 text-[10px] text-emerald-600 hover:bg-emerald-50"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarTab({
  content,
  plans,
  onRunStrategist,
  agentRunning,
}: {
  content: ContentItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plans: any[];
  onRunStrategist: () => void;
  agentRunning: string | null;
}) {
  const scheduledContent = content.filter((c: ContentItem) => c.scheduled_at);
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay() + i + 1); // Monday start
    return d;
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Content Calendar</h2>
        <button
          onClick={onRunStrategist}
          disabled={agentRunning !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          Run Strategist
        </button>
      </div>

      {/* Weekly view */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayStr = day.toISOString().split("T")[0];
          const dayContent = scheduledContent.filter((c: ContentItem) =>
            c.scheduled_at?.startsWith(dayStr)
          );
          const isToday = dayStr === today.toISOString().split("T")[0];
          return (
            <div
              key={dayStr}
              className={`min-h-[150px] rounded-lg border p-2 ${
                isToday
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  isToday ? "text-emerald-700" : "text-zinc-500"
                }`}
              >
                {day.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <div className="mt-2 space-y-1">
                {dayContent.map((item: ContentItem) => (
                  <div
                    key={item.id}
                    className={`rounded px-2 py-1 text-[10px] font-medium ${
                      PILLAR_COLORS[item.pillar] || PILLAR_COLORS.general
                    }`}
                  >
                    {item.title?.slice(0, 30)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Plans history */}
      {plans.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">
            Weekly Plans
          </h3>
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border border-zinc-200 bg-white p-4"
              >
                <p className="text-sm font-medium text-zinc-900">
                  Week of {plan.week_start}
                </p>
                {plan.plan?.theme && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Theme: {plan.plan.theme}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoutTab({
  alerts,
  onUpdateStatus,
  onRunScout,
  onCreateContent,
  agentRunning,
}: {
  alerts: AlertItem[];
  onUpdateStatus: (id: string, status: string) => void;
  onRunScout: () => void;
  onCreateContent: (topic: string) => void;
  agentRunning: string | null;
}) {
  const TYPE_BADGES: Record<string, string> = {
    engage: "bg-blue-100 text-blue-700",
    content_idea: "bg-emerald-100 text-emerald-700",
    trending: "bg-amber-100 text-amber-700",
    competitor: "bg-red-100 text-red-700",
    mention: "bg-purple-100 text-purple-700",
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Scout Alerts</h2>
        <button
          onClick={onRunScout}
          disabled={agentRunning !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          Run Scout
        </button>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            No alerts yet. Run the Scout agent to scan for opportunities.
          </p>
        ) : (
          alerts.map((alert: AlertItem) => (
            <div
              key={alert.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {alert.source}
                  </span>
                  {alert.opportunity_type && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        TYPE_BADGES[alert.opportunity_type] || "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {alert.opportunity_type}
                    </span>
                  )}
                  {alert.status !== "new" && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                      {alert.status}
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-400">
                  {new Date(alert.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-700">{alert.summary}</p>
              {alert.suggested_response && (
                <p className="mt-1 text-xs text-zinc-500 italic">
                  Suggested: {alert.suggested_response}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                {alert.suggested_content_topic && (
                  <button
                    onClick={() =>
                      onCreateContent(alert.suggested_content_topic)
                    }
                    className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                  >
                    Create Content
                  </button>
                )}
                {alert.url && (
                  <a
                    href={alert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Engage
                  </a>
                )}
                <button
                  onClick={() => onUpdateStatus(alert.id, "dismissed")}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PartnershipsTab({
  partnerships,
  templates,
  onRunOutreach,
  agentRunning,
  onRefresh,
}: {
  partnerships: PartnershipItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  templates: any[];
  onRunOutreach: (ids: string[]) => void;
  agentRunning: string | null;
  onRefresh: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const PARTNERSHIP_STATUSES = [
    "not_contacted",
    "email_1_sent",
    "email_2_sent",
    "email_3_sent",
    "email_4_sent",
    "email_5_sent",
    "replied",
    "in_conversation",
    "active",
    "declined",
  ];

  const TIER_BADGES: Record<string, string> = {
    top_20: "bg-amber-100 text-amber-700 border-amber-200",
    premium: "bg-purple-100 text-purple-700 border-purple-200",
    standard: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Partnerships</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <Mail className="h-4 w-4" />
            Templates
          </button>
          <button
            onClick={() => {
              if (selectedIds.length > 0) onRunOutreach(selectedIds);
            }}
            disabled={agentRunning !== null || selectedIds.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Run Outreach ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Templates section */}
      {showTemplates && (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">
            Email Sequence Templates
          </h3>
          {templates.length === 0 ? (
            <p className="text-sm text-zinc-400">No templates configured yet.</p>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded border border-zinc-100 p-2"
                >
                  <span className="text-xs font-mono text-zinc-400">
                    #{t.sequence_position}
                  </span>
                  <span className="text-xs font-medium text-zinc-600">
                    {t.tier}
                  </span>
                  <span className="flex-1 text-sm text-zinc-700 truncate">
                    {t.subject_template}
                  </span>
                  <span
                    className={`text-xs ${
                      t.approved ? "text-emerald-600" : "text-zinc-400"
                    }`}
                  >
                    {t.approved ? "Approved" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pipeline columns */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PARTNERSHIP_STATUSES.map((status) => {
          const items = partnerships.filter(
            (p: PartnershipItem) => p.outreach_status === status
          );
          if (items.length === 0 && !["not_contacted", "replied", "active"].includes(status)) return null;
          return (
            <div key={status} className="min-w-[200px] flex-shrink-0">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {status.replace(/_/g, " ")}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((p: PartnershipItem) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, p.id]);
                          } else {
                            setSelectedIds(
                              selectedIds.filter((id) => id !== p.id)
                            );
                          }
                        }}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {p.course_name}
                        </p>
                        <p className="text-xs text-zinc-500">{p.destination}</p>
                        <span
                          className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            TIER_BADGES[p.tier] || TIER_BADGES.standard
                          }`}
                        >
                          {p.tier}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onRefresh}
        className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh
      </button>
    </div>
  );
}

function NewsletterTab({
  content,
  subscribers,
  onRunNewsletter,
  agentRunning,
}: {
  content: ContentItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribers: any[];
  onRunNewsletter: () => void;
  agentRunning: string | null;
}) {
  const latestDraft = content.find((c: ContentItem) => c.status === "draft");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newsletterData = latestDraft?.instagram_carousel as any; // newsletter JSON stored here
  const [section1Text, setSection1Text] = useState("");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Newsletter</h2>
          <p className="text-sm text-zinc-500">
            {subscribers.filter((s: { subscribed: boolean }) => s.subscribed).length} subscribers
          </p>
        </div>
        <button
          onClick={onRunNewsletter}
          disabled={agentRunning !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          Generate Newsletter
        </button>
      </div>

      {latestDraft && newsletterData ? (
        <div className="space-y-6">
          {/* Subject line options */}
          {newsletterData.subject_line_options && (
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-zinc-700">
                Subject Lines
              </h3>
              <div className="space-y-1">
                {newsletterData.subject_line_options.map(
                  (s: string, i: number) => (
                    <p key={i} className="text-sm text-zinc-600">
                      {i + 1}. {s}
                    </p>
                  )
                )}
              </div>
            </div>
          )}

          {/* Section 1 - Grayson writes */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700">
              Section 1: From the First Tee
              <span className="ml-2 text-xs font-normal text-zinc-400">
                (You write this)
              </span>
            </h3>
            {newsletterData.section_1_talking_points && (
              <div className="mb-3 space-y-2">
                {newsletterData.section_1_talking_points.map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (tp: any, i: number) => (
                    <div
                      key={i}
                      className="rounded border border-zinc-100 bg-zinc-50 p-2 text-xs text-zinc-600"
                    >
                      <strong>Angle:</strong> {tp.angle}
                      <br />
                      <strong>Opening:</strong> {tp.opening_scene}
                    </div>
                  )
                )}
              </div>
            )}
            <textarea
              value={section1Text}
              onChange={(e) => setSection1Text(e.target.value)}
              placeholder="Write your From the First Tee section here..."
              rows={8}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Section 2 - The Intel */}
          {newsletterData.section_2_intel && (
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-zinc-700">
                Section 2: The Intel
              </h3>
              <div className="space-y-2">
                {newsletterData.section_2_intel.map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (item: any, i: number) => (
                    <div key={i} className="text-sm text-zinc-600">
                      <strong>{item.headline || item.title}</strong>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {item.body || item.content}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Section 3 - Trip Sheet */}
          {newsletterData.section_3_trip_sheet && (
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-zinc-700">
                Section 3: The Trip Sheet
              </h3>
              <div className="text-sm text-zinc-600">
                <p>
                  <strong>
                    {newsletterData.section_3_trip_sheet.destination}
                  </strong>{" "}
                  ({newsletterData.section_3_trip_sheet.region})
                </p>
                <p className="mt-1 text-xs">
                  {newsletterData.section_3_trip_sheet.why_go}
                </p>
                {newsletterData.section_3_trip_sheet.budget_estimate && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Budget:{" "}
                    {newsletterData.section_3_trip_sheet.budget_estimate}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              <Check className="h-4 w-4" />
              Approve & Schedule
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
              <Eye className="h-4 w-4" />
              Preview
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <Mail className="mx-auto h-12 w-12 text-zinc-300" />
          <p className="mt-4 text-sm text-zinc-500">
            No newsletter draft. Generate one to get started.
          </p>
        </div>
      )}

      {/* Past issues */}
      {content.filter((c: ContentItem) => c.status === "published").length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">
            Past Issues
          </h3>
          <div className="space-y-2">
            {content
              .filter((c: ContentItem) => c.status === "published")
              .map((c: ContentItem) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3"
                >
                  <span className="text-sm text-zinc-700">{c.title}</span>
                  <span className="text-xs text-zinc-400">
                    {new Date(c.published_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({
  content,
  plans,
  onRunAnalyst,
  agentRunning,
}: {
  content: ContentItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plans: any[];
  onRunAnalyst: () => void;
  agentRunning: string | null;
}) {
  const published = content.filter((c: ContentItem) => c.status === "published");
  const totalImpressions = published.reduce(
    (sum: number, c: ContentItem) => sum + (c.impressions || 0),
    0
  );
  const totalLikes = published.reduce(
    (sum: number, c: ContentItem) => sum + (c.likes || 0),
    0
  );
  const totalClicks = published.reduce(
    (sum: number, c: ContentItem) => sum + (c.link_clicks || 0),
    0
  );
  const engagementRate =
    totalImpressions > 0
      ? (
          ((totalLikes +
            published.reduce(
              (s: number, c: ContentItem) => s + (c.comments || 0),
              0
            )) /
            totalImpressions) *
          100
        ).toFixed(2)
      : "0.00";

  const latestAnalysis = plans.find((p) => p.performance_summary);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Analytics</h2>
        <button
          onClick={onRunAnalyst}
          disabled={agentRunning !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <BarChart3 className="h-4 w-4" />
          Run Analyst
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Impressions", value: totalImpressions.toLocaleString() },
          { label: "Engagement Rate", value: `${engagementRate}%` },
          { label: "Link Clicks", value: totalClicks.toLocaleString() },
          { label: "Published", value: published.length.toString() },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <p className="text-xs font-medium text-zinc-500">{m.label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Platform comparison */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 mb-6">
        <h3 className="mb-3 text-sm font-semibold text-zinc-700">
          Content by Platform
        </h3>
        <div className="space-y-2">
          {["instagram", "twitter", "linkedin", "youtube"].map((platform) => {
            const count = published.filter(
              (c: ContentItem) => c.scheduled_platform === platform
            ).length;
            const maxCount = Math.max(
              published.length || 1,
              1
            );
            return (
              <div key={platform} className="flex items-center gap-3">
                <span className="w-20 text-xs text-zinc-500 capitalize">
                  {platform}
                </span>
                <div className="flex-1 h-5 rounded-full bg-zinc-100">
                  <div
                    className="h-5 rounded-full bg-emerald-500"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      minWidth: count > 0 ? "8px" : "0",
                    }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-zinc-500">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pillar performance */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 mb-6">
        <h3 className="mb-3 text-sm font-semibold text-zinc-700">
          Content by Pillar
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(PILLAR_COLORS).map(([pillar, colorClass]) => {
            const count = content.filter(
              (c: ContentItem) => c.pillar === pillar
            ).length;
            return (
              <div
                key={pillar}
                className="rounded-lg border border-zinc-100 p-3 text-center"
              >
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
                >
                  {pillar.replace(/_/g, " ")}
                </span>
                <p className="mt-1 text-lg font-bold text-zinc-900">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top performers */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 mb-6">
        <h3 className="mb-3 text-sm font-semibold text-zinc-700">
          Top Performing Content
        </h3>
        {published.length === 0 ? (
          <p className="text-sm text-zinc-400">No published content yet.</p>
        ) : (
          <div className="space-y-2">
            {published
              .sort(
                (a: ContentItem, b: ContentItem) =>
                  (b.impressions || 0) - (a.impressions || 0)
              )
              .slice(0, 5)
              .map((c: ContentItem) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded border border-zinc-100 p-2"
                >
                  <span className="text-sm text-zinc-700 truncate max-w-[60%]">
                    {c.title}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {(c.impressions || 0).toLocaleString()} impressions
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Latest analysis */}
      {latestAnalysis?.performance_summary && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 mb-6">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">
            Latest Analysis
          </h3>
          <pre className="max-h-64 overflow-auto rounded bg-zinc-50 p-3 text-xs text-zinc-600">
            {JSON.stringify(latestAnalysis.performance_summary, null, 2)}
          </pre>
        </div>
      )}

      {/* Referral Section */}
      <ReferralAnalyticsSection />
    </div>
  );
}

function ReferralAnalyticsSection() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Fetch referral performance data from marketing_performance
    const supabase = createClient();
    supabase
      .from("marketing_performance")
      .select("*")
      .eq("platform", "referral")
      .order("metric_date", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setStats(data);
      });
  }, []);

  // Fetch leaderboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("referral_codes")
      .select("user_id, code, clicks")
      .order("clicks", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setLeaderboard(data);
      });
  }, []);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-purple-600" />
        Referrals
      </h3>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="text-2xl font-bold text-zinc-900">{stats?.likes || 0}</div>
          <div className="text-xs text-zinc-500">Total referrals</div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="text-2xl font-bold text-zinc-900">{stats?.shares || 0}</div>
          <div className="text-xs text-zinc-500">This week</div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="text-2xl font-bold text-emerald-600">{stats?.comments || 0}</div>
          <div className="text-xs text-zinc-500">Active referrals</div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="text-2xl font-bold text-zinc-900">
            {stats && stats.impressions > 0
              ? (stats.likes / stats.impressions).toFixed(2)
              : "0.00"}
          </div>
          <div className="text-xs text-zinc-500">Viral coefficient</div>
        </div>
      </div>
      {leaderboard.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-zinc-500 mb-2">Top Referrers</h4>
          <div className="space-y-1">
            {leaderboard.map((r, i) => (
              <div key={r.code} className="flex items-center justify-between rounded bg-zinc-50 px-3 py-2 text-xs">
                <span className="text-zinc-400 font-mono w-6">{i + 1}.</span>
                <span className="text-zinc-600 font-mono flex-1">{r.code}</span>
                <span className="text-zinc-700 font-medium">{r.clicks || 0} clicks</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
        <Gift className="h-3.5 w-3.5" />
        Reward status: <span className="font-medium text-zinc-600">Off (pre-launch)</span>
      </div>
    </div>
  );
}

function SEOTab({
  onRunSEOWriter,
  agentRunning,
}: {
  onRunSEOWriter: (keyword: string) => void;
  agentRunning: string | null;
}) {
  const [keyword, setKeyword] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/marketing/seo-writer")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [agentRunning]);

  async function updatePostStatus(id: string, status: string) {
    const res = await fetch("/api/admin/marketing/seo-writer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const { post } = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === id ? post : p)));
    }
  }

  const drafts = posts.filter((p) => p.status === "draft");
  const inReview = posts.filter((p) => p.status === "review");
  const published = posts.filter((p) => p.status === "published");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">SEO Blog Posts</h2>
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            View live blog at nassau.golf/blog
          </a>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Target keyword..."
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            onClick={() => {
              onRunSEOWriter(keyword || "");
              setKeyword("");
            }}
            disabled={agentRunning === "seo-writer"}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {agentRunning === "seo-writer" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            Generate Post
          </button>
        </div>
      </div>

      {postsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Draft column */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider">
              Draft ({drafts.length})
            </h3>
            <div className="space-y-3">
              {drafts.map((post) => (
                <SEOPostCard key={post.id} post={post} onStatusChange={updatePostStatus} />
              ))}
            </div>
          </div>
          {/* Review column */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-amber-600 uppercase tracking-wider">
              Review ({inReview.length})
            </h3>
            <div className="space-y-3">
              {inReview.map((post) => (
                <SEOPostCard key={post.id} post={post} onStatusChange={updatePostStatus} />
              ))}
            </div>
          </div>
          {/* Published column */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-emerald-600 uppercase tracking-wider">
              Published ({published.length})
            </h3>
            <div className="space-y-3">
              {published.map((post) => (
                <SEOPostCard key={post.id} post={post} onStatusChange={updatePostStatus} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SEOPostCard({
  post,
  onStatusChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: any;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 hover:shadow-sm transition-shadow">
      <a
        href={`/admin/marketing/seo/${post.id}`}
        className="block"
      >
        <h4 className="text-sm font-semibold text-zinc-900 line-clamp-2 hover:text-emerald-700 transition-colors">{post.title}</h4>
        <div className="mt-1 text-xs text-emerald-600">{post.target_keyword}</div>
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
          <span>{post.word_count} words</span>
          {post.page_views > 0 && (
            <>
              <span>&bull;</span>
              <span>{post.page_views} views</span>
            </>
          )}
          {post.published_at && (
            <>
              <span>&bull;</span>
              <span>{new Date(post.published_at).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </a>
      <div className="mt-3 flex gap-2">
        {post.status === "draft" && (
          <button
            onClick={() => onStatusChange(post.id, "review")}
            className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200"
          >
            Send to Review
          </button>
        )}
        {post.status === "review" && (
          <button
            onClick={() => onStatusChange(post.id, "published")}
            className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
          >
            Mark Published
          </button>
        )}
        {post.status === "published" && post.slug && (
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
          >
            <ExternalLink className="h-3 w-3" />
            View
          </a>
        )}
      </div>
    </div>
  );
}

function SettingsTab({
  onRunOnboarding,
  onRunReactivation,
  onRunReferralTracker,
  agentRunning,
}: {
  onRunOnboarding: () => void;
  onRunReactivation: () => void;
  onRunReferralTracker: () => void;
  agentRunning: string | null;
}) {
  const [bufferKey, setBufferKey] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [onboardingStats, setOnboardingStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reactivationStats, setReactivationStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [referralStats, setReferralStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/marketing/onboarding")
      .then((r) => r.json())
      .then(setOnboardingStats)
      .catch(() => {});
    fetch("/api/admin/marketing/reactivation")
      .then((r) => r.json())
      .then(setReactivationStats)
      .catch(() => {});
  }, [agentRunning]);

  return (
    <div className="max-w-2xl">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Settings</h2>

      <div className="space-y-6">
        {/* Onboarding Card */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-600" />
              Onboarding
            </h3>
            <button
              onClick={onRunOnboarding}
              disabled={agentRunning === "onboarding"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {agentRunning === "onboarding" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Run
            </button>
          </div>
          {onboardingStats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-50 p-3">
                <div className="text-2xl font-bold text-zinc-900">{onboardingStats.total_in_sequence || 0}</div>
                <div className="text-xs text-zinc-500">Users in sequence</div>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <div className="text-2xl font-bold text-emerald-600">{onboardingStats.completion_rate || 0}%</div>
                <div className="text-xs text-zinc-500">Completion rate</div>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 col-span-2">
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>Day 0: {onboardingStats.day0_sent || 0}</span>
                  <span>Day 3: {onboardingStats.day3_sent || 0}</span>
                  <span>Day 7: {onboardingStats.day7_sent || 0}</span>
                  <span className="text-emerald-600 font-medium">Completed: {onboardingStats.completed || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reactivation Card */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-amber-600" />
              Reactivation
            </h3>
            <button
              onClick={onRunReactivation}
              disabled={agentRunning === "reactivation"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {agentRunning === "reactivation" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Run
            </button>
          </div>
          {reactivationStats && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-zinc-50 p-3">
                  <div className="text-2xl font-bold text-zinc-900">{reactivationStats.dormant_users || 0}</div>
                  <div className="text-xs text-zinc-500">Dormant users</div>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <div className="text-2xl font-bold text-zinc-900">{reactivationStats.emails_this_month || 0}</div>
                  <div className="text-xs text-zinc-500">Emails this month</div>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <div className="text-2xl font-bold text-emerald-600">{reactivationStats.reactivation_rate || 0}%</div>
                  <div className="text-xs text-zinc-500">Reactivation rate</div>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <div className="text-2xl font-bold text-red-600">{reactivationStats.churned_users || 0}</div>
                  <div className="text-xs text-zinc-500">Churned</div>
                </div>
              </div>
              {reactivationStats.recent_emails?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 mb-2">Recent Emails</h4>
                  <div className="space-y-1">
                    {reactivationStats.recent_emails.slice(0, 5).map((e: { id: string; email: string; email_subject: string; opened: boolean; clicked: boolean; email_sent_at: string }) => (
                      <div key={e.id} className="flex items-center justify-between rounded bg-zinc-50 px-3 py-2 text-xs">
                        <span className="text-zinc-700 truncate max-w-[180px]">{e.email}</span>
                        <span className="text-zinc-500 truncate max-w-[150px]">{e.email_subject}</span>
                        <div className="flex gap-1.5">
                          {e.opened && <span className="text-emerald-600">opened</span>}
                          {e.clicked && <span className="text-blue-600">clicked</span>}
                          {!e.opened && !e.clicked && <span className="text-zinc-400">sent</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Referral Tracker Card */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-600" />
              Referral Tracker
            </h3>
            <button
              onClick={onRunReferralTracker}
              disabled={agentRunning === "referral-tracker"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {agentRunning === "referral-tracker" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Run
            </button>
          </div>
          <p className="text-xs text-zinc-500">Processes referral stats daily. Reward status: <span className="font-medium text-zinc-700">Off (pre-launch)</span></p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">
            API Keys
          </h3>
          <label className="block text-sm font-medium text-zinc-600">
            Buffer API Key
          </label>
          <input
            type="password"
            value={bufferKey}
            onChange={(e) => setBufferKey(e.target.value)}
            placeholder="Enter Buffer API key..."
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Used for auto-publishing to social platforms (future feature)
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">
            Agent Schedules (UTC)
          </h3>
          <div className="space-y-2 text-sm text-zinc-600">
            <div className="flex justify-between">
              <span>Strategist</span>
              <span className="text-xs text-zinc-400">Mon 6 AM CT (11:00 UTC)</span>
            </div>
            <div className="flex justify-between">
              <span>Scout</span>
              <span className="text-xs text-zinc-400">Daily 7 AM CT (12:00 UTC)</span>
            </div>
            <div className="flex justify-between">
              <span>Writer</span>
              <span className="text-xs text-zinc-400">Daily 10 AM CT (15:00 UTC)</span>
            </div>
            <div className="flex justify-between">
              <span>Distributor</span>
              <span className="text-xs text-zinc-400">Daily 6 AM + 5 PM CT</span>
            </div>
            <div className="flex justify-between">
              <span>Analyst</span>
              <span className="text-xs text-zinc-400">Fri 6 PM CT (23:00 UTC)</span>
            </div>
            <div className="flex justify-between">
              <span>Partnerships</span>
              <span className="text-xs text-zinc-400">Daily 9 AM CT (14:00 UTC)</span>
            </div>
            <div className="flex justify-between">
              <span>Newsletter</span>
              <span className="text-xs text-zinc-400">Sat 10 AM CT (15:00 UTC)</span>
            </div>
            <div className="flex justify-between border-t border-zinc-100 pt-2 mt-2">
              <span>Onboarding</span>
              <span className="text-xs text-zinc-400">Daily 8 AM CT (13:00 UTC)</span>
            </div>
            <div className="flex justify-between">
              <span>Reactivation</span>
              <span className="text-xs text-zinc-400">Mon 9 AM CT (14:00 UTC)</span>
            </div>
            <div className="flex justify-between">
              <span>SEO Writer</span>
              <span className="text-xs text-zinc-400">Wed 11 AM CT (16:00 UTC)</span>
            </div>
            <div className="flex justify-between">
              <span>Referral Tracker</span>
              <span className="text-xs text-zinc-400">Daily 6 AM CT (11:00 UTC)</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">
            Admin Access
          </h3>
          <p className="text-sm text-zinc-500">
            Admin email: graybfrank@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===================== MODALS ===================== */

function ContentModal({
  content,
  onClose,
  onStatusChange,
}: {
  content: ContentItem;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 p-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {content.title}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  PILLAR_COLORS[content.pillar] || PILLAR_COLORS.general
                }`}
              >
                {content.pillar}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                {content.status}
              </span>
              {content.scheduled_platform && (
                <span className="text-xs text-zinc-400">
                  {content.scheduled_platform}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {content.instagram_caption && (
            <ContentSection title="Instagram Caption" content={content.instagram_caption} />
          )}
          {content.instagram_carousel && (
            <ContentSection
              title="Instagram Carousel"
              content={JSON.stringify(content.instagram_carousel, null, 2)}
              isJSON
            />
          )}
          {content.instagram_reel_script && (
            <ContentSection title="Instagram Reel Script" content={content.instagram_reel_script} />
          )}
          {content.twitter_standalone && (
            <ContentSection title="Twitter" content={content.twitter_standalone} />
          )}
          {content.twitter_thread && (
            <ContentSection
              title="Twitter Thread"
              content={JSON.stringify(content.twitter_thread, null, 2)}
              isJSON
            />
          )}
          {content.linkedin_post && (
            <ContentSection title="LinkedIn" content={content.linkedin_post} />
          )}
          {content.youtube_short_script && (
            <ContentSection title="YouTube Short" content={content.youtube_short_script} />
          )}
          {content.email_segment && (
            <ContentSection title="Email Segment" content={content.email_segment} />
          )}
          {content.visual_brief && (
            <ContentSection
              title="Visual Brief"
              content={JSON.stringify(content.visual_brief, null, 2)}
              isJSON
            />
          )}
        </div>

        <div className="flex gap-2 border-t border-zinc-200 p-4">
          {content.status !== "approved" && (
            <button
              onClick={() => onStatusChange("approved")}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Check className="h-4 w-4" />
              Approve
            </button>
          )}
          {content.status === "approved" && (
            <button
              onClick={() => onStatusChange("scheduled")}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Clock className="h-4 w-4" />
              Schedule
            </button>
          )}
          <button
            onClick={() => onStatusChange("review")}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <Eye className="h-4 w-4" />
            Send to Review
          </button>
        </div>
      </div>
    </div>
  );
}

function ContentSection({
  title,
  content,
  isJSON,
}: {
  title: string;
  content: string;
  isJSON?: boolean;
}) {
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </h4>
      {isJSON ? (
        <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
          {content}
        </pre>
      ) : (
        <p className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
          {content}
        </p>
      )}
    </div>
  );
}

function WriterModal({
  form,
  onChange,
  onClose,
  onSubmit,
  running,
}: {
  form: { topic: string; pillar: string; format: string; notes: string };
  onChange: (form: { topic: string; pillar: string; format: string; notes: string }) => void;
  onClose: () => void;
  onSubmit: () => void;
  running: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Run Writer Agent</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Topic *
            </label>
            <input
              type="text"
              value={form.topic}
              onChange={(e) => onChange({ ...form, topic: e.target.value })}
              placeholder="e.g., Scottsdale trip budget breakdown"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Pillar
            </label>
            <select
              value={form.pillar}
              onChange={(e) => onChange({ ...form, pillar: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="trip_planning">Trip Planning</option>
              <option value="betting_culture">Betting Culture</option>
              <option value="course_reviews">Course Reviews</option>
              <option value="budget_breakdowns">Budget Breakdowns</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Format
            </label>
            <select
              value={form.format}
              onChange={(e) => onChange({ ...form, format: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Platforms</option>
              <option value="carousel">Instagram Carousel</option>
              <option value="reel">Instagram Reel</option>
              <option value="thread">Twitter Thread</option>
              <option value="linkedin">LinkedIn Post</option>
              <option value="youtube_short">YouTube Short</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
              placeholder="Any specific angles or details..."
              rows={3}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onSubmit}
            disabled={!form.topic.trim() || running}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {running ? "Generating..." : "Generate Content"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
