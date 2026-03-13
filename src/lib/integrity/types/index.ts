export type ProbeSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ProbeStatus = "PASS" | "FAIL" | "SKIP" | "ERROR";
export type RunStatus = "GREEN" | "YELLOW" | "RED";
export type TriggerType = "cron" | "manual" | "ci";
export type ProbeCategory = "auth" | "data_integrity" | "email" | "api_health" | "business_logic" | "frontend";
export interface ProbeResult {
  probe: string;
  category: ProbeCategory;
  status: ProbeStatus;
  severity: ProbeSeverity;
  detail: string;
  durationMs: number;
  suggestedFix?: string;
  metadata?: Record<string, unknown>;
}
export interface IntegrityReport {
  runAt: string;
  trigger: TriggerType;
  status: RunStatus;
  totalChecks: number;
  passed: number;
  failed: number;
  errors: number;
  criticals: number;
  durationMs: number;
  results: ProbeResult[];
  summary: string;
}
export interface StoredIntegrityCheck {
  id: string;
  run_at: string;
  trigger: TriggerType;
  status: RunStatus;
  total_checks: number;
  passed: number;
  failed: number;
  criticals: number;
  report: IntegrityReport;
  alert_sent: boolean;
}
export const PROBE_CATEGORIES: ProbeCategory[] = [
  "auth", "data_integrity", "email", "api_health", "business_logic", "frontend",
];
