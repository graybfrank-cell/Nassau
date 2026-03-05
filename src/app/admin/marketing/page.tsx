"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Mail,
  Globe,
  User,
  X,
  ArrowUpDown,
  BarChart3,
  Handshake,
  FileText,
  Settings,
  Columns3,
  CalendarDays,
  Radar,
  Newspaper,
  PenTool,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  ThumbsUp,
  Trash2,
  ExternalLink,
  Key,
  Zap,
  Users,
  TrendingUp,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface Partnership {
  id: string;
  course_name: string;
  destination: string;
  tier: string;
  course_type: string;
  website_url: string | null;
  marketing_contact_name: string | null;
  marketing_contact_email: string | null;
  booking_email: string | null;
  outreach_status: string;
  confidence: string | null;
  source_notes: string | null;
  needs_review: boolean;
  updated_at: string;
}

interface Stats {
  totalCourses: number;
  hasEmail: number;
  contacted: number;
  replied: number;
  active: number;
}

interface ResearchResult {
  success: boolean;
  courseId: string;
  marketing_contact_name: string | null;
  marketing_contact_email: string | null;
  booking_email: string | null;
  website_url: string | null;
  confidence: string;
  source_notes: string;
  error?: string;
  raw?: string;
}

type FilterType = "all" | "no_contact" | "has_email" | "needs_review" | "contacted" | "replied";
type SortField = "destination" | "tier" | "status" | "updated";
type TabKey = "pipeline" | "calendar" | "scout" | "partnerships" | "newsletter" | "seo" | "analytics" | "settings";

// ─── Main Page ──────────────────────────────────────────────

export default function MarketingCommandCenter() {
  const [activeTab, setActiveTab] = useState<TabKey>("pipeline");

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "pipeline", label: "Pipeline", icon: <Columns3 className="h-4 w-4" /> },
    { key: "calendar", label: "Calendar", icon: <CalendarDays className="h-4 w-4" /> },
    { key: "scout", label: "Scout", icon: <Radar className="h-4 w-4" /> },
    { key: "partnerships", label: "Partnerships", icon: <Handshake className="h-4 w-4" /> },
    { key: "newsletter", label: "Newsletter", icon: <Newspaper className="h-4 w-4" /> },
    { key: "seo", label: "SEO", icon: <PenTool className="h-4 w-4" /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-5">
        <h1 className="text-2xl font-bold text-zinc-900">Marketing Command Center</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage partnerships, outreach, and marketing content
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 bg-white px-6">
        <nav className="-mb-px flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          {activeTab === "pipeline" && <PipelineTab />}
          {activeTab === "calendar" && <CalendarTab />}
          {activeTab === "scout" && <ScoutTab />}
          {activeTab === "partnerships" && <PartnershipsTab />}
          {activeTab === "newsletter" && <NewsletterTab />}
          {activeTab === "seo" && <SEOTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline Tab (Kanban) ──────────────────────────────────

const PIPELINE_STAGES = ["idea", "draft", "review", "approved", "scheduled", "published"] as const;
const STAGE_LABELS: Record<string, string> = {
  idea: "Idea",
  draft: "Draft",
  review: "Review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
};
const STAGE_COLORS: Record<string, string> = {
  idea: "border-zinc-300 bg-zinc-50",
  draft: "border-blue-300 bg-blue-50",
  review: "border-yellow-300 bg-yellow-50",
  approved: "border-emerald-300 bg-emerald-50",
  scheduled: "border-purple-300 bg-purple-50",
  published: "border-green-300 bg-green-50",
};

interface ContentItem {
  id: string;
  title?: string;
  type?: string;
  status?: string;
  topic?: string;
  platform?: string;
  scheduled_date?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

function PipelineTab() {
  const [columns, setColumns] = useState<Record<string, ContentItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/marketing/pipeline");
        const data = await res.json();
        setColumns(data.columns || {});
        setTotal(data.total || 0);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">{total} content items</p>
      </div>
      <div className="grid grid-cols-6 gap-3 overflow-x-auto">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage} className={`rounded-lg border-2 p-3 ${STAGE_COLORS[stage]}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                {STAGE_LABELS[stage]}
              </h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-600 shadow-sm">
                {(columns[stage] || []).length}
              </span>
            </div>
            <div className="space-y-2">
              {(columns[stage] || []).length === 0 ? (
                <p className="py-4 text-center text-xs text-zinc-400">Empty</p>
              ) : (
                (columns[stage] || []).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-zinc-200 bg-white p-2.5 shadow-sm"
                  >
                    <p className="text-xs font-medium text-zinc-900 line-clamp-2">
                      {item.title || item.topic || "Untitled"}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {item.type && (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
                          {item.type}
                        </span>
                      )}
                      {item.platform && (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
                          {item.platform}
                        </span>
                      )}
                    </div>
                    {item.scheduled_date && (
                      <p className="mt-1 text-[10px] text-zinc-400">
                        <Clock className="mr-0.5 inline h-3 w-3" />
                        {new Date(item.scheduled_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Calendar Tab (Weekly View) ─────────────────────────────

interface WeeklyPlan {
  id: string;
  week_start?: string;
  week_end?: string;
  theme?: string;
  status?: string;
  content_items?: unknown[];
  notes?: string;
  created_at?: string;
  [key: string]: unknown;
}

function CalendarTab() {
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/marketing/calendar");
        const data = await res.json();
        setPlans(data.plans || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
        <CalendarDays className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
        <p className="font-medium text-zinc-700">No Weekly Plans</p>
        <p className="mt-1 text-sm">Weekly marketing plans will appear here once created.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="rounded-lg border border-zinc-200 bg-white p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-zinc-900">
                {plan.week_start
                  ? `Week of ${new Date(plan.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                  : "Week"}
                {plan.week_end &&
                  ` – ${new Date(plan.week_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
              </h3>
              {plan.theme && (
                <p className="mt-1 text-sm text-zinc-500">Theme: {plan.theme}</p>
              )}
            </div>
            {plan.status && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  plan.status === "active"
                    ? "bg-green-100 text-green-700"
                    : plan.status === "draft"
                      ? "bg-zinc-100 text-zinc-600"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {plan.status}
              </span>
            )}
          </div>
          {plan.notes && (
            <p className="mt-2 text-sm text-zinc-600">{plan.notes}</p>
          )}
          {Array.isArray(plan.content_items) && plan.content_items.length > 0 && (
            <div className="mt-3 border-t border-zinc-100 pt-3">
              <p className="mb-1 text-xs font-medium text-zinc-500">
                {plan.content_items.length} content items scheduled
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Scout Tab (Alerts) ─────────────────────────────────────

interface ScoutAlert {
  id: string;
  title?: string;
  description?: string;
  source?: string;
  source_url?: string;
  type?: string;
  status?: string;
  relevance_score?: number;
  created_at?: string;
  [key: string]: unknown;
}

function ScoutTab() {
  const [alerts, setAlerts] = useState<ScoutAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "engaged" | "dismissed">("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/marketing/scout");
        const data = await res.json();
        setAlerts(data.alerts || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleAction(id: string, action: "create" | "engage" | "dismiss") {
    try {
      await fetch("/api/admin/marketing/scout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status:
                  action === "dismiss"
                    ? "dismissed"
                    : action === "engage"
                      ? "engaged"
                      : "content_created",
              }
            : a
        )
      );
    } catch {
      // silent
    }
  }

  const filtered = alerts.filter((a) => {
    if (filter === "all") return true;
    if (filter === "new") return !a.status || a.status === "new";
    return a.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <>
      {/* Filter chips */}
      <div className="mb-4 flex gap-2">
        {(["all", "new", "engaged", "dismissed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
          <Radar className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p className="font-medium text-zinc-700">No Alerts</p>
          <p className="mt-1 text-sm">Scout alerts will appear here as they are detected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-zinc-900">
                      {alert.title || "Untitled Alert"}
                    </h3>
                    {alert.type && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                        {alert.type}
                      </span>
                    )}
                    {alert.status && alert.status !== "new" && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          alert.status === "dismissed"
                            ? "bg-zinc-100 text-zinc-500"
                            : alert.status === "engaged"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {alert.status}
                      </span>
                    )}
                  </div>
                  {alert.description && (
                    <p className="mt-1 text-xs text-zinc-600 line-clamp-2">
                      {alert.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-400">
                    {alert.source && <span>Source: {alert.source}</span>}
                    {alert.created_at && (
                      <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                    )}
                    {alert.relevance_score != null && (
                      <span>Relevance: {alert.relevance_score}%</span>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-1.5">
                  {alert.source_url && (
                    <a
                      href={alert.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-zinc-200 p-1.5 text-zinc-400 hover:text-zinc-600"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleAction(alert.id, "create")}
                    className="rounded-lg border border-zinc-200 p-1.5 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600"
                    title="Create Content"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleAction(alert.id, "engage")}
                    className="rounded-lg border border-zinc-200 p-1.5 text-zinc-400 hover:bg-blue-50 hover:text-blue-600"
                    title="Engage"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleAction(alert.id, "dismiss")}
                    className="rounded-lg border border-zinc-200 p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                    title="Dismiss"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Newsletter Tab ─────────────────────────────────────────

interface Subscriber {
  id: string;
  email?: string;
  name?: string;
  status?: string;
  created_at?: string;
  sections?: unknown[];
  talking_points?: string[];
  [key: string]: unknown;
}

function NewsletterTab() {
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/marketing/newsletter");
        const data = await res.json();
        setSubscriberCount(data.subscriberCount || 0);
        setSubscribers(data.subscribers || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Total Subscribers</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {subscriberCount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Active</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {subscribers.filter((s) => s.status === "active" || !s.status).length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Recent (7d)</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {
              subscribers.filter((s) => {
                if (!s.created_at) return false;
                const d = new Date(s.created_at);
                return Date.now() - d.getTime() < 7 * 86400000;
              }).length
            }
          </p>
        </div>
      </div>

      {/* Subscriber list */}
      {subscribers.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
          <Newspaper className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p className="font-medium text-zinc-700">No Subscribers Yet</p>
          <p className="mt-1 text-sm">Newsletter subscribers will appear here.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr key={sub.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 text-zinc-900">{sub.email || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{sub.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        sub.status === "active" || !sub.status
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {sub.status || "active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {sub.created_at
                      ? new Date(sub.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── SEO Tab ────────────────────────────────────────────────

function SEOTab() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
      <PenTool className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
      <p className="font-medium text-zinc-700">SEO Blog Pipeline</p>
      <p className="mt-1 text-sm">Blog post SEO pipeline and content optimization tools.</p>
    </div>
  );
}

// ─── Analytics Tab ──────────────────────────────────────────

interface AnalyticsMetrics {
  totalViews: number;
  uniqueVisitors: number;
  signups: number;
  conversionRate: number;
  topReferrers: string[];
  topPages: string[];
}

interface PerformanceEntry {
  id?: string;
  date?: string;
  total_views?: number;
  views?: number;
  unique_visitors?: number;
  visitors?: number;
  signups?: number;
  conversion_rate?: number;
  [key: string]: unknown;
}

function AnalyticsTab() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalViews: 0,
    uniqueVisitors: 0,
    signups: 0,
    conversionRate: 0,
    topReferrers: [],
    topPages: [],
  });
  const [history, setHistory] = useState<PerformanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/marketing/analytics");
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
        setHistory(data.history || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <>
      {/* Metric Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Views", value: metrics.totalViews, icon: <Eye className="h-5 w-5 text-blue-500" /> },
          { label: "Unique Visitors", value: metrics.uniqueVisitors, icon: <Users className="h-5 w-5 text-emerald-500" /> },
          { label: "Signups", value: metrics.signups, icon: <ThumbsUp className="h-5 w-5 text-purple-500" /> },
          {
            label: "Conversion Rate",
            value: `${(metrics.conversionRate * 100).toFixed(1)}%`,
            icon: <TrendingUp className="h-5 w-5 text-amber-500" />,
          },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-2">
              {m.icon}
              <p className="text-xs font-medium text-zinc-500">{m.label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
            </p>
          </div>
        ))}
      </div>

      {/* History table */}
      {history.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h3 className="text-sm font-medium text-zinc-700">Performance History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-2 text-left font-medium text-zinc-600">Date</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-600">Views</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-600">Visitors</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-600">Signups</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 14).map((entry, i) => (
                  <tr key={entry.id || i} className="border-b border-zinc-100">
                    <td className="px-4 py-2 text-zinc-700">
                      {entry.date
                        ? new Date(entry.date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right text-zinc-600">
                      {(entry.total_views || entry.views || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-zinc-600">
                      {(entry.unique_visitors || entry.visitors || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-zinc-600">
                      {(entry.signups || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Breakdowns */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {metrics.topReferrers.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-medium text-zinc-700">Top Referrers</h3>
            <ul className="space-y-1">
              {metrics.topReferrers.map((r, i) => (
                <li key={i} className="text-xs text-zinc-600">{r}</li>
              ))}
            </ul>
          </div>
        )}
        {metrics.topPages.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-medium text-zinc-700">Top Pages</h3>
            <ul className="space-y-1">
              {metrics.topPages.map((p, i) => (
                <li key={i} className="text-xs text-zinc-600">{p}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {history.length === 0 && metrics.totalViews === 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p className="font-medium text-zinc-700">No Analytics Data</p>
          <p className="mt-1 text-sm">Performance data will appear here as it is collected.</p>
        </div>
      )}
    </>
  );
}

// ─── Settings Tab ───────────────────────────────────────────

interface MarketingSettings {
  anthropicKeyConfigured: boolean;
  supabaseConfigured: boolean;
  serviceRoleConfigured: boolean;
  senderEmail: string;
  schedules: Record<string, string>;
}

function SettingsTab() {
  const [settings, setSettings] = useState<MarketingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/marketing/settings");
        const data = await res.json();
        setSettings(data.settings || null);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
        <Settings className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
        <p className="font-medium text-zinc-700">Settings Unavailable</p>
        <p className="mt-1 text-sm">Could not load settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schedule Overview */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Clock className="h-4 w-4 text-zinc-400" />
          Agent Schedules
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(settings.schedules).map(([agent, schedule]) => (
            <div key={agent} className="flex items-center justify-between rounded-md border border-zinc-100 p-3">
              <span className="text-sm text-zinc-700 capitalize">
                {agent.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <span className="text-xs text-zinc-500">{schedule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* API Key Status */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Key className="h-4 w-4 text-zinc-400" />
          API Key Status
        </h3>
        <div className="space-y-2">
          {[
            { label: "Anthropic API Key", ok: settings.anthropicKeyConfigured },
            { label: "Supabase Connection", ok: settings.supabaseConfigured },
            { label: "Service Role Key", ok: settings.serviceRoleConfigured },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.ok ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-zinc-700">{item.label}</span>
              <span
                className={`ml-auto text-xs font-medium ${
                  item.ok ? "text-green-600" : "text-red-600"
                }`}
              >
                {item.ok ? "Configured" : "Missing"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sender info */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Mail className="h-4 w-4 text-zinc-400" />
          Outreach Configuration
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Sender Email:</span>
          <span className="text-sm font-medium text-zinc-900">{settings.senderEmail}</span>
        </div>
      </div>

      {/* Quick-action cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <Zap className="mb-2 h-6 w-6 text-amber-500" />
          <h4 className="text-sm font-medium text-zinc-900">Onboarding Emails</h4>
          <p className="mt-1 text-xs text-zinc-500">
            Automated welcome sequence for new users.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <RefreshCw className="mb-2 h-6 w-6 text-blue-500" />
          <h4 className="text-sm font-medium text-zinc-900">Reactivation</h4>
          <p className="mt-1 text-xs text-zinc-500">
            Win-back campaigns for inactive users.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <Users className="mb-2 h-6 w-6 text-emerald-500" />
          <h4 className="text-sm font-medium text-zinc-900">Referral Program</h4>
          <p className="mt-1 text-xs text-zinc-500">
            Invite-a-friend referral tracking and rewards.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Partnerships Tab ───────────────────────────────────────

function PartnershipsTab() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    hasEmail: 0,
    contacted: 0,
    replied: 0,
    active: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortField>("destination");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Research state
  const [researchingId, setResearchingId] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [editingFields, setEditingFields] = useState<Partial<ResearchResult>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Batch research state
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const batchAbortRef = useRef(false);

  // Selected rows for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── Fetch partnerships ───────────────────────────────────

  const fetchPartnerships = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        search,
        filter,
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/admin/partnerships?${params}`);
      const data = await res.json();
      setPartnerships(data.partnerships || []);
      setTotalPages(data.totalPages || 1);
      if (data.stats) setStats(data.stats);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [page, search, filter, sortBy, sortDir]);

  useEffect(() => {
    fetchPartnerships();
  }, [fetchPartnerships]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filter, sortBy, sortDir]);

  // ─── Research a single course ─────────────────────────────

  async function researchCourse(p: Partnership) {
    setResearchingId(p.id);
    setResearchResult(null);
    setEditingFields({});

    try {
      const res = await fetch("/api/admin/partnerships/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: p.id,
          courseName: p.course_name,
          destination: p.destination,
          websiteUrl: p.website_url,
        }),
      });
      const result: ResearchResult = await res.json();
      setResearchResult(result);
      if (result.success) {
        setEditingFields({
          marketing_contact_name: result.marketing_contact_name,
          marketing_contact_email: result.marketing_contact_email,
          booking_email: result.booking_email,
          website_url: result.website_url,
        });
      }
    } catch {
      setResearchResult({
        success: false,
        courseId: p.id,
        marketing_contact_name: null,
        marketing_contact_email: null,
        booking_email: null,
        website_url: null,
        confidence: "low",
        source_notes: "",
        error: "Network error",
      });
    } finally {
      setResearchingId(null);
    }
  }

  // ─── Save confirmed contact ───────────────────────────────

  async function saveContact(courseId: string) {
    setSavingId(courseId);
    try {
      const res = await fetch(`/api/admin/partnerships/${courseId}/contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketing_contact_name: editingFields.marketing_contact_name || null,
          marketing_contact_email: editingFields.marketing_contact_email || null,
          booking_email: editingFields.booking_email || null,
          website_url: editingFields.website_url || null,
          confidence: researchResult?.confidence || null,
          source_notes: researchResult?.source_notes || null,
          needs_review: false,
        }),
      });
      if (res.ok) {
        setResearchResult(null);
        setEditingFields({});
        await fetchPartnerships();
      }
    } catch {
      // handle silently
    } finally {
      setSavingId(null);
    }
  }

  // ─── Batch research ───────────────────────────────────────

  async function batchResearch() {
    setBatchRunning(true);
    batchAbortRef.current = false;

    try {
      const res = await fetch("/api/admin/partnerships?filter=no_contact&limit=9999&page=1");
      const data = await res.json();
      const courses: Partnership[] = data.partnerships || [];

      setBatchProgress({ current: 0, total: courses.length });

      for (let i = 0; i < courses.length; i++) {
        if (batchAbortRef.current) break;

        setBatchProgress({ current: i + 1, total: courses.length });
        const course = courses[i];

        try {
          const researchRes = await fetch("/api/admin/partnerships/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseId: course.id,
              courseName: course.course_name,
              destination: course.destination,
              websiteUrl: course.website_url,
            }),
          });
          const result: ResearchResult = await researchRes.json();

          if (result.success) {
            const isHigh = result.confidence === "high";
            await fetch(`/api/admin/partnerships/${course.id}/contact`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                marketing_contact_name: result.marketing_contact_name,
                marketing_contact_email: result.marketing_contact_email,
                booking_email: result.booking_email,
                website_url: result.website_url,
                confidence: result.confidence,
                source_notes: result.source_notes,
                needs_review: !isHigh,
              }),
            });
          }
        } catch {
          // Skip failed individual course
        }

        // 2-second delay to avoid rate limits
        if (i < courses.length - 1 && !batchAbortRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } catch {
      // handle silently
    } finally {
      setBatchRunning(false);
      setBatchProgress({ current: 0, total: 0 });
      await fetchPartnerships();
    }
  }

  // ─── Escape key to dismiss research card ──────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && researchResult) {
        setResearchResult(null);
        setEditingFields({});
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [researchResult]);

  // ─── Toggle sort ──────────────────────────────────────────

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  }

  // ─── Toggle selection ─────────────────────────────────────

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === partnerships.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(partnerships.map((p) => p.id)));
    }
  }

  // ─── Bulk research selected ───────────────────────────────

  async function bulkResearchSelected() {
    const selected = partnerships.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) return;

    setBatchRunning(true);
    batchAbortRef.current = false;
    setBatchProgress({ current: 0, total: selected.length });

    for (let i = 0; i < selected.length; i++) {
      if (batchAbortRef.current) break;
      setBatchProgress({ current: i + 1, total: selected.length });
      const course = selected[i];

      try {
        const researchRes = await fetch("/api/admin/partnerships/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: course.id,
            courseName: course.course_name,
            destination: course.destination,
            websiteUrl: course.website_url,
          }),
        });
        const result: ResearchResult = await researchRes.json();

        if (result.success) {
          const isHigh = result.confidence === "high";
          await fetch(`/api/admin/partnerships/${course.id}/contact`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              marketing_contact_name: result.marketing_contact_name,
              marketing_contact_email: result.marketing_contact_email,
              booking_email: result.booking_email,
              website_url: result.website_url,
              confidence: result.confidence,
              source_notes: result.source_notes,
              needs_review: !isHigh,
            }),
          });
        }
      } catch {
        // skip
      }

      if (i < selected.length - 1 && !batchAbortRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setBatchRunning(false);
    setBatchProgress({ current: 0, total: 0 });
    setSelectedIds(new Set());
    await fetchPartnerships();
  }

  // ─── Helpers ──────────────────────────────────────────────

  function confidenceColor(c: string | null) {
    if (c === "high") return "bg-green-100 text-green-700";
    if (c === "medium") return "bg-yellow-100 text-yellow-700";
    if (c === "low") return "bg-red-100 text-red-700";
    return "bg-zinc-100 text-zinc-500";
  }

  function statusBadge(status: string) {
    switch (status) {
      case "contacted":
        return "bg-blue-100 text-blue-700";
      case "replied":
        return "bg-green-100 text-green-700";
      case "active":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-zinc-100 text-zinc-500";
    }
  }

  const contactEmail = (p: Partnership) => p.marketing_contact_email || p.booking_email;

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "no_contact", label: "No Contact" },
    { key: "has_email", label: "Has Email" },
    { key: "needs_review", label: "Needs Review" },
    { key: "contacted", label: "Contacted" },
    { key: "replied", label: "Replied" },
  ];

  // ─── Render ───────────────────────────────────────────────

  return (
    <>
      {/* Stats Bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total Courses", value: stats.totalCourses },
          { label: "Has Email", value: stats.hasEmail },
          { label: "Contacted", value: stats.contacted },
          { label: "Replied", value: stats.replied },
          { label: "Active Partnerships", value: stats.active },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">
              {s.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses or destinations..."
            className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Batch Research */}
        <button
          onClick={batchResearch}
          disabled={batchRunning}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {batchRunning ? "Stop" : "Research All Uncontacted"}
        </button>

        {/* Bulk research selected */}
        {selectedIds.size > 0 && (
          <button
            onClick={bulkResearchSelected}
            disabled={batchRunning}
            className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
          >
            Research Selected ({selectedIds.size})
          </button>
        )}

        {batchRunning && (
          <button
            onClick={() => {
              batchAbortRef.current = true;
            }}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Stop Batch
          </button>
        )}
      </div>

      {/* Batch progress bar */}
      {batchRunning && batchProgress.total > 0 && (
        <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-3">
          <div className="flex items-center justify-between text-sm text-zinc-600 mb-2">
            <span>
              Researching {batchProgress.current} of {batchProgress.total}...
            </span>
            <span>
              {Math.round((batchProgress.current / batchProgress.total) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${(batchProgress.current / batchProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      partnerships.length > 0 &&
                      selectedIds.size === partnerships.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-300"
                  />
                </th>
                <th
                  className="cursor-pointer px-3 py-3 text-left font-medium text-zinc-600 hover:text-zinc-900"
                  onClick={() => toggleSort("destination")}
                >
                  <span className="flex items-center gap-1">
                    Course
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-3 py-3 text-left font-medium text-zinc-600 hover:text-zinc-900"
                  onClick={() => toggleSort("tier")}
                >
                  <span className="flex items-center gap-1">
                    Tier / Type
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="px-3 py-3 text-left font-medium text-zinc-600">
                  Contact
                </th>
                <th
                  className="cursor-pointer px-3 py-3 text-left font-medium text-zinc-600 hover:text-zinc-900"
                  onClick={() => toggleSort("status")}
                >
                  <span className="flex items-center gap-1">
                    Status
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="px-3 py-3 text-right font-medium text-zinc-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-12 text-center text-zinc-400"
                  >
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : partnerships.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-12 text-center text-zinc-400"
                  >
                    No courses found
                  </td>
                </tr>
              ) : (
                partnerships.map((p) => (
                  <CourseRow
                    key={p.id}
                    partnership={p}
                    selected={selectedIds.has(p.id)}
                    onToggleSelect={() => toggleSelect(p.id)}
                    researchingId={researchingId}
                    batchRunning={batchRunning}
                    researchResult={
                      researchResult?.courseId === p.id
                        ? researchResult
                        : null
                    }
                    editingFields={
                      researchResult?.courseId === p.id
                        ? editingFields
                        : {}
                    }
                    savingId={savingId}
                    onResearch={() => researchCourse(p)}
                    onSave={() => saveContact(p.id)}
                    onDismiss={() => {
                      setResearchResult(null);
                      setEditingFields({});
                    }}
                    onEditField={(fields) =>
                      setEditingFields({ ...editingFields, ...fields })
                    }
                    contactEmail={contactEmail(p)}
                    confidenceColor={confidenceColor}
                    statusBadge={statusBadge}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
            <p className="text-xs text-zinc-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-3 w-3" />
                Prev
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Course Row ─────────────────────────────────────────────

function CourseRow({
  partnership: p,
  selected,
  onToggleSelect,
  researchingId,
  batchRunning,
  researchResult,
  editingFields,
  savingId,
  onResearch,
  onSave,
  onDismiss,
  onEditField,
  contactEmail,
  confidenceColor,
  statusBadge,
}: {
  partnership: Partnership;
  selected: boolean;
  onToggleSelect: () => void;
  researchingId: string | null;
  batchRunning: boolean;
  researchResult: ResearchResult | null;
  editingFields: Partial<ResearchResult>;
  savingId: string | null;
  onResearch: () => void;
  onSave: () => void;
  onDismiss: () => void;
  onEditField: (fields: Partial<ResearchResult>) => void;
  contactEmail: string | null;
  confidenceColor: (c: string | null) => string;
  statusBadge: (s: string) => string;
}) {
  return (
    <>
      <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="rounded border-zinc-300"
          />
        </td>
        <td className="px-3 py-3">
          <div className="font-medium text-zinc-900">{p.course_name}</div>
          <div className="text-xs text-zinc-500">{p.destination}</div>
        </td>
        <td className="px-3 py-3">
          <div className="flex gap-1.5">
            {p.tier && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {p.tier}
              </span>
            )}
            {p.course_type && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                {p.course_type}
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-3">
          {contactEmail ? (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-zinc-700">{contactEmail}</span>
            </div>
          ) : (
            <span className="text-xs text-zinc-400">No contact</span>
          )}
          {p.needs_review && (
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
              Needs review
            </span>
          )}
        </td>
        <td className="px-3 py-3">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(p.outreach_status)}`}
          >
            {p.outreach_status === "none" ? "Not contacted" : p.outreach_status}
          </span>
        </td>
        <td className="px-3 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onResearch}
              disabled={researchingId === p.id || batchRunning}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {researchingId === p.id ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Researching...
                </span>
              ) : (
                "Research"
              )}
            </button>
            <button
              disabled={!contactEmail}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Outreach
            </button>
          </div>
        </td>
      </tr>

      {/* Research result card */}
      {researchResult && (
        <tr>
          <td colSpan={6} className="px-3 py-0">
            <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-zinc-900">
                    Research Results — {p.course_name}
                  </h3>
                  {researchResult.success && (
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${confidenceColor(researchResult.confidence)}`}
                    >
                      Confidence: {researchResult.confidence?.toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={onDismiss}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!researchResult.success ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {researchResult.error || "Research failed"}
                  {researchResult.raw && (
                    <pre className="mt-2 text-xs whitespace-pre-wrap">
                      {researchResult.raw}
                    </pre>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <EditableField
                      icon={<User className="h-4 w-4 text-zinc-400" />}
                      label="Marketing Contact"
                      value={editingFields.marketing_contact_name}
                      onChange={(v) =>
                        onEditField({ marketing_contact_name: v })
                      }
                    />
                    <EditableField
                      icon={<Mail className="h-4 w-4 text-zinc-400" />}
                      label="Email"
                      value={editingFields.marketing_contact_email}
                      onChange={(v) =>
                        onEditField({ marketing_contact_email: v })
                      }
                    />
                    <EditableField
                      icon={<Mail className="h-4 w-4 text-zinc-400" />}
                      label="Booking Email"
                      value={editingFields.booking_email}
                      onChange={(v) => onEditField({ booking_email: v })}
                    />
                    <EditableField
                      icon={<Globe className="h-4 w-4 text-zinc-400" />}
                      label="Website"
                      value={editingFields.website_url}
                      onChange={(v) => onEditField({ website_url: v })}
                    />
                  </div>

                  {researchResult.source_notes && (
                    <p className="mt-3 text-xs text-zinc-500">
                      Source: {researchResult.source_notes}
                    </p>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={onSave}
                      disabled={savingId === p.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {savingId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      Confirm & Save
                    </button>
                    <button
                      onClick={onDismiss}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Skip
                    </button>
                    <button
                      onClick={onResearch}
                      disabled={researchingId === p.id}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Research Again
                    </button>
                  </div>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Editable Field Component ───────────────────────────────

function EditableField({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className="w-32 text-zinc-500">{label}:</span>
      {editing ? (
        <input
          autoFocus
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
          className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
        />
      ) : (
        <span
          className="flex-1 cursor-pointer text-zinc-900 hover:text-emerald-600"
          onClick={() => setEditing(true)}
        >
          {value || <span className="text-zinc-400">null</span>}
          <span className="ml-2 text-xs text-zinc-400 hover:text-emerald-500">
            [Edit]
          </span>
        </span>
      )}
    </div>
  );
}
