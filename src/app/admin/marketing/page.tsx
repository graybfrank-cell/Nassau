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

// ─── Component ──────────────────────────────────────────────

export default function AdminMarketingPage() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCourses: 0, hasEmail: 0, contacted: 0, replied: 0, active: 0 });
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
      setStats(data.stats || stats);
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

    // Fetch all uncontacted courses (no email)
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
            // Auto-save HIGH confidence, queue others for review
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
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Marketing Partnerships</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage golf course partnerships and contact research
          </p>
        </div>

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
              <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
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
                      checked={partnerships.length > 0 && selectedIds.size === partnerships.length}
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
                  <th className="px-3 py-3 text-left font-medium text-zinc-600">Contact</th>
                  <th
                    className="cursor-pointer px-3 py-3 text-left font-medium text-zinc-600 hover:text-zinc-900"
                    onClick={() => toggleSort("status")}
                  >
                    <span className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center text-zinc-400">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </td>
                  </tr>
                ) : partnerships.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center text-zinc-400">
                      No courses found
                    </td>
                  </tr>
                ) : (
                  partnerships.map((p) => (
                    <>
                      <tr
                        key={p.id}
                        className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
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
                          {contactEmail(p) ? (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-xs text-zinc-700">{contactEmail(p)}</span>
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
                              onClick={() => researchCourse(p)}
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
                              disabled={!contactEmail(p)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Send Outreach
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Research result card */}
                      {researchResult && researchResult.courseId === p.id && (
                        <tr key={`${p.id}-research`}>
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
                                  onClick={() => {
                                    setResearchResult(null);
                                    setEditingFields({});
                                  }}
                                  className="text-zinc-400 hover:text-zinc-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              {!researchResult.success ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                  {researchResult.error || "Research failed"}
                                  {researchResult.raw && (
                                    <pre className="mt-2 text-xs whitespace-pre-wrap">{researchResult.raw}</pre>
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
                                        setEditingFields({ ...editingFields, marketing_contact_name: v })
                                      }
                                    />
                                    <EditableField
                                      icon={<Mail className="h-4 w-4 text-zinc-400" />}
                                      label="Email"
                                      value={editingFields.marketing_contact_email}
                                      onChange={(v) =>
                                        setEditingFields({
                                          ...editingFields,
                                          marketing_contact_email: v,
                                        })
                                      }
                                    />
                                    <EditableField
                                      icon={<Mail className="h-4 w-4 text-zinc-400" />}
                                      label="Booking Email"
                                      value={editingFields.booking_email}
                                      onChange={(v) =>
                                        setEditingFields({ ...editingFields, booking_email: v })
                                      }
                                    />
                                    <EditableField
                                      icon={<Globe className="h-4 w-4 text-zinc-400" />}
                                      label="Website"
                                      value={editingFields.website_url}
                                      onChange={(v) =>
                                        setEditingFields({ ...editingFields, website_url: v })
                                      }
                                    />
                                  </div>

                                  {researchResult.source_notes && (
                                    <p className="mt-3 text-xs text-zinc-500">
                                      Source: {researchResult.source_notes}
                                    </p>
                                  )}

                                  <div className="mt-4 flex gap-2">
                                    <button
                                      onClick={() => saveContact(p.id)}
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
                                      onClick={() => {
                                        setResearchResult(null);
                                        setEditingFields({});
                                      }}
                                      className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                      Skip
                                    </button>
                                    <button
                                      onClick={() => researchCourse(p)}
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
      </div>
    </div>
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
          <span className="ml-2 text-xs text-zinc-400 hover:text-emerald-500">[Edit]</span>
        </span>
      )}
    </div>
  );
}
