"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [occurrenceLogs, setOccurrenceLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedOccurrenceId, setExpandedOccurrenceId] = useState<string | null>(
    null
  );
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [reportsCollapsed, setReportsCollapsed] = useState(false);
  const [occurrencesCollapsed, setOccurrencesCollapsed] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(true);
  const [reportPage, setReportPage] = useState(1);
  const [now, setNow] = useState<Date>(new Date());

  async function fetchLogs() {
    const { data, error } = await supabase
      .from("event_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setLogs(data || []);
      setLastUpdated(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    }
  }

  async function fetchOccurrenceLogs() {
    const { data, error } = await supabase
      .from("occurrence_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setOccurrenceLogs(data || []);
    }
  }

  async function fetchAuditLogs() {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setAuditLogs(data || []);
    }
  }

  async function writeAuditLog(log: any, action: string, details?: string) {
    try {
      await supabase.from("audit_logs").insert({
        event_log_id: log.id,
        log_number: log.log_number,
        site_location: log.site_location,
        action,
        details,
        performed_by: "Control Room",
      });

      fetchAuditLogs();
    } catch (error) {
      console.error("Audit log error:", error);
    }
  }

  async function updateStatus(id: string, status: "Open" | "Closed") {
    const log = logs.find((item) => item.id === id);

    const { error } = await supabase
      .from("event_logs")
      .update({ status })
      .eq("id", id);

    if (!error) {
      if (log) {
        await writeAuditLog(
          log,
          status === "Closed" ? "Report Closed" : "Report Reopened"
        );
      }

      fetchLogs();
    } else {
      alert("Could not update status: " + error.message);
    }
  }

  async function deleteLog(id: string) {
    const log = logs.find((item) => item.id === id);

    const confirmed = window.confirm(
      "Are you sure you want to delete this report? This cannot be undone."
    );

    if (!confirmed) return;

    if (log) {
      await writeAuditLog(log, "Report Deleted", "Report removed from dashboard");
    }

    const { error } = await supabase.from("event_logs").delete().eq("id", id);

    if (!error) {
      if (expandedId === id) setExpandedId(null);
      fetchLogs();
    } else {
      alert("Could not delete report: " + error.message);
    }
  }

  async function deleteOccurrenceLog(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this occurrence log? This cannot be undone."
    );

    if (!confirmed) return;

    const { error } = await supabase.from("occurrence_logs").delete().eq("id", id);

    if (!error) {
      if (expandedOccurrenceId === id) setExpandedOccurrenceId(null);
      fetchOccurrenceLogs();
    } else {
      alert("Could not delete occurrence log: " + error.message);
    }
  }

  function openReportFromFeed(id: string) {
    setReportsCollapsed(false);
    setExpandedId(id);

    setTimeout(() => {
      const reportElement = document.getElementById(`report-${id}`);
      reportElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
  }

  function isLogOpen(log: any) {
    return (log.status || "Open") === "Open";
  }

  function getTodayDateString() {
    return new Date().toISOString().split("T")[0];
  }

  function isToday(value: string | null | undefined) {
    if (!value) return false;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;

    return date.toISOString().split("T")[0] === getTodayDateString();
  }

  function isOccurrenceToday(log: any) {
    if (log.occurrence_date) {
      return log.occurrence_date === getTodayDateString();
    }

    return isToday(log.created_at);
  }

  function isIncidentToday(log: any) {
    if (log.incident_date) {
      return log.incident_date === getTodayDateString();
    }

    return isToday(log.created_at);
  }

  function getMostCommon(items: string[]) {
    const counts: Record<string, number> = {};

    items.forEach((item) => {
      if (!item) return;
      counts[item] = (counts[item] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) return "N/A";

    return `${sorted[0][0]} (${sorted[0][1]})`;
  }

  function formatTime(value: string | null | undefined) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function formatDateTime(value: string | null | undefined) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString();
  }

  function getOccurrenceDisplayTime(log: any) {
    if (log.occurrence_time) {
      return log.occurrence_time.slice(0, 5);
    }

    return formatTime(log.created_at);
  }

  function getOccurrenceActivityType(log: any) {
    return log.occurrence_type || "Occurrence";
  }

  function getOccurrenceActivityClasses(log: any) {
    if (log.priority === "Action Required") {
      return "border-yellow-300 bg-yellow-100 text-yellow-900";
    }

    if (log.priority === "Information") {
      return "border-blue-300 bg-blue-100 text-blue-900";
    }

    return "border-slate-300 bg-slate-100 text-slate-800";
  }

  function getOccurrencePriorityClasses(priority: string) {
    if (priority === "Action Required") {
      return "border-yellow-300 bg-yellow-100 text-yellow-900";
    }

    if (priority === "Information") {
      return "border-blue-300 bg-blue-100 text-blue-900";
    }

    return "border-slate-300 bg-slate-100 text-slate-800";
  }

  function getIncidentAge(value: string | null | undefined) {
    if (!value) return "N/A";

    const created = new Date(value);
    if (Number.isNaN(created.getTime())) return "N/A";

    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));

    if (diffMins < 1) return "Less than 1 min";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"}`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours < 24) return `${hours}h ${mins}m`;

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return `${days}d ${remainingHours}h`;
  }

  function getSeverityClasses(severity: string) {
    switch (severity) {
      case "Critical":
        return "bg-red-700 text-white";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-900";
      case "Low":
      default:
        return "bg-blue-50 text-blue-800 border border-blue-200";
    }
  }

  function getSeverityBorder(severity: string) {
    switch (severity) {
      case "Critical":
        return "border-l-4 border-red-700";
      case "High":
        return "border-l-4 border-orange-400";
      case "Medium":
        return "border-l-4 border-yellow-300";
      case "Low":
      default:
        return "border-l-4 border-slate-300";
    }
  }

  function getRowBackground(isOpen: boolean, severity: string) {
    if (isOpen && severity === "Critical") {
      return "bg-gradient-to-r from-red-50 via-red-50 to-white";
    }

    if (isOpen) return "bg-red-50";

    return "bg-slate-50";
  }

  function getIntelligenceBadges(log: any, severity: string) {
    const badges = [];

    if (severity === "Critical") {
      badges.push({
        label: "Critical Incident",
        icon: "!",
        className: "bg-red-700 text-white border border-red-800",
      });
    }

    if (severity === "High") {
      badges.push({
        label: "High Severity",
        icon: "↑",
        className: "bg-orange-50 text-orange-800 border border-orange-300",
      });
    }

    if (log.emergency_services) {
      badges.push({
        label: "Emergency Services",
        icon: "+",
        className: "bg-red-50 text-red-800 border border-red-300",
      });
    }

    if (log.emergency_service_log_number) {
      badges.push({
        label: `CAD: ${log.emergency_service_log_number}`,
        icon: "#",
        className: "bg-slate-100 text-slate-800 border border-slate-300",
      });
    }

    if (log.follow_up_required) {
      badges.push({
        label: "Follow-up Required",
        icon: "!",
        className: "bg-yellow-50 text-yellow-900 border border-yellow-300",
      });
    }

    if (log.supervisor_notified) {
      badges.push({
        label: "Supervisor Notified",
        icon: "i",
        className: "bg-blue-50 text-blue-800 border border-blue-300",
      });
    }

    if (log.client_notified) {
      badges.push({
        label: "Client Notified",
        icon: "C",
        className: "bg-purple-50 text-purple-800 border border-purple-300",
      });
    }

    return badges;
  }

  function getPriorityReason(log: any) {
    if (log.severity === "Critical") return "Critical Incident";
    if (log.emergency_services) return "Emergency Services";
    if (log.follow_up_required) return "Follow-up Required";
    if (log.severity === "High") return "High Severity";
    return "Open Report";
  }

  function getPriorityClasses(log: any) {
    if (log.severity === "Critical") {
      return "border-red-300 bg-red-50 text-red-900";
    }

    if (log.emergency_services) {
      return "border-purple-300 bg-purple-50 text-purple-900";
    }

    if (log.follow_up_required) {
      return "border-yellow-300 bg-yellow-50 text-yellow-900";
    }

    if (log.severity === "High") {
      return "border-orange-300 bg-orange-50 text-orange-900";
    }

    return "border-slate-200 bg-slate-50 text-slate-800";
  }

  function getActivityType(log: any) {
    if (isLogOpen(log) && log.severity === "Critical") {
      return "Critical Incident";
    }

    if (isLogOpen(log) && log.emergency_services) {
      return "Emergency Services";
    }

    if (isLogOpen(log) && log.follow_up_required) {
      return "Follow-up Required";
    }

    if (isLogOpen(log)) return "Open Report";

    return "Report Closed";
  }

  function getActivityClasses(log: any) {
    if (isLogOpen(log) && log.severity === "Critical") {
      return "border-red-300 bg-red-100 text-red-900";
    }

    if (isLogOpen(log) && log.emergency_services) {
      return "border-purple-300 bg-purple-100 text-purple-900";
    }

    if (isLogOpen(log) && log.follow_up_required) {
      return "border-yellow-300 bg-yellow-100 text-yellow-900";
    }

    if (isLogOpen(log)) {
      return "border-orange-300 bg-orange-100 text-orange-900";
    }

    return "border-green-300 bg-green-50 text-green-800";
  }

  function getAuditForLog(log: any) {
    return auditLogs.filter(
      (audit) =>
        audit.event_log_id === log.id ||
        (audit.log_number && audit.log_number === log.log_number)
    );
  }

  useEffect(() => {
    fetchLogs();
    fetchOccurrenceLogs();
    fetchAuditLogs();

    const fetchInterval = setInterval(() => {
      fetchLogs();
      fetchOccurrenceLogs();
      fetchAuditLogs();
    }, 5000);

    const clockInterval = setInterval(() => setNow(new Date()), 30000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const openLogs = logs.filter((log) => isLogOpen(log));

  const todayIncidentLogs = logs.filter((log) => isIncidentToday(log));
  const todayOccurrenceLogs = occurrenceLogs.filter((log) =>
    isOccurrenceToday(log)
  );

  const todayPatrols = todayOccurrenceLogs.filter(
    (log) => log.occurrence_type === "Patrol Completed"
  ).length;

  const todayVehicleChecks = todayOccurrenceLogs.filter(
    (log) => log.occurrence_type === "Vehicle Check"
  ).length;

  const todayWelfareChecks = todayOccurrenceLogs.filter(
    (log) => log.occurrence_type === "Welfare Check"
  ).length;

  const todayLockUnlocks = todayOccurrenceLogs.filter(
    (log) => log.occurrence_type === "Lock-Up" || log.occurrence_type === "Unlock"
  ).length;

  const todayActionRequired = todayOccurrenceLogs.filter(
    (log) => log.priority === "Action Required"
  ).length;

  const mostActiveSite = getMostCommon([
    ...todayIncidentLogs.map((log) => log.site_location),
    ...todayOccurrenceLogs.map((log) => log.site_location),
  ]);

  const mostActiveOfficer = getMostCommon([
    ...todayIncidentLogs.map((log) => log.officer_name),
    ...todayOccurrenceLogs.map((log) => log.officer_name),
  ]);

  const openCount = openLogs.length;
  const closedCount = logs.filter((log) => log.status === "Closed").length;
  const highOpenCount = openLogs.filter((log) => log.severity === "High").length;
  const criticalOpenCount = openLogs.filter(
    (log) => log.severity === "Critical"
  ).length;
  const emergencyOpenCount = openLogs.filter(
    (log) => log.emergency_services
  ).length;
  const followUpOpenCount = openLogs.filter(
    (log) => log.follow_up_required
  ).length;
  const occurrenceCount = occurrenceLogs.length;

  const priorityLogs = openLogs
    .filter(
      (log) =>
        log.severity === "Critical" ||
        log.severity === "High" ||
        log.emergency_services ||
        log.follow_up_required
    )
    .sort((a, b) => {
      const score = (log: any) => {
        if (log.severity === "Critical") return 1;
        if (log.emergency_services) return 2;
        if (log.follow_up_required) return 3;
        if (log.severity === "High") return 4;
        return 5;
      };

      const scoreDifference = score(a) - score(b);

      if (scoreDifference !== 0) return scoreDifference;

      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();

      return aDate - bDate;
    })
    .slice(0, 3);

  const combinedActivityLogs = [
    ...logs.map((log) => ({
      type: "incident",
      id: log.id,
      created_at: log.created_at,
      data: log,
    })),
    ...occurrenceLogs.map((log) => ({
      type: "occurrence",
      id: log.id,
      created_at: log.created_at,
      data: log,
    })),
  ]
    .sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 10);

  const filteredLogs = logs
    .filter((log) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        log.site_location?.toLowerCase().includes(searchText) ||
        log.officer_name?.toLowerCase().includes(searchText) ||
        log.description?.toLowerCase().includes(searchText) ||
        log.exact_location?.toLowerCase().includes(searchText) ||
        log.log_number?.toLowerCase().includes(searchText) ||
        log.status?.toLowerCase().includes(searchText) ||
        log.severity?.toLowerCase().includes(searchText) ||
        log.emergency_service_type?.toLowerCase().includes(searchText) ||
        log.emergency_service_log_number?.toLowerCase().includes(searchText);

      const matchesOpenOnly = !showOpenOnly || isLogOpen(log);

      return matchesSearch && matchesOpenOnly;
    })
    .sort((a, b) => {
      const aOpen = isLogOpen(a);
      const bOpen = isLogOpen(b);

      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;

      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();

      return bDate - aDate;
    });

  const filteredOccurrenceLogs = occurrenceLogs
    .filter((log) => {
      const searchText = search.toLowerCase();

      return (
        log.site_location?.toLowerCase().includes(searchText) ||
        log.officer_name?.toLowerCase().includes(searchText) ||
        log.officer_id?.toLowerCase().includes(searchText) ||
        log.site_id?.toLowerCase().includes(searchText) ||
        log.occurrence_type?.toLowerCase().includes(searchText) ||
        log.priority?.toLowerCase().includes(searchText) ||
        log.exact_location?.toLowerCase().includes(searchText) ||
        log.details?.toLowerCase().includes(searchText)
      );
    })
    .sort((a, b) => {
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();

      return bDate - aDate;
    });

  const reportsPerPage = 10;
  const totalReportPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / reportsPerPage)
  );
  const safeReportPage = Math.min(reportPage, totalReportPages);
  const reportStartIndex = (safeReportPage - 1) * reportsPerPage;
  const paginatedLogs = filteredLogs.slice(
    reportStartIndex,
    reportStartIndex + reportsPerPage
  );

  useEffect(() => {
    setReportPage(1);
    setExpandedId(null);
  }, [search, showOpenOnly]);

  useEffect(() => {
    if (reportPage > totalReportPages) {
      setReportPage(totalReportPages);
    }
  }, [reportPage, totalReportPages]);

  const commandStats = [
    {
      label: "Open Incidents",
      value: openCount,
      helper: "Require active control",
      className: "border-red-200 bg-red-50 text-red-800",
      valueClassName: "text-red-700",
    },
    {
      label: "Critical",
      value: criticalOpenCount,
      helper: "Immediate priority",
      className:
        criticalOpenCount > 0
          ? "border-red-500 bg-red-100 text-red-900 animate-pulse shadow-md shadow-red-500/40"
          : "border-red-200 bg-red-50 text-red-800",
      valueClassName: "text-red-800",
    },
    {
      label: "Emergency",
      value: emergencyOpenCount,
      helper: "Services involved",
      className: "border-purple-200 bg-purple-50 text-purple-900",
      valueClassName: "text-purple-800",
    },
    {
      label: "Follow-up",
      value: followUpOpenCount,
      helper: "Outstanding actions",
      className: "border-yellow-200 bg-yellow-50 text-yellow-900",
      valueClassName: "text-yellow-800",
    },
  ];

  const shiftStats = [
    {
      label: "Incidents Today",
      value: todayIncidentLogs.length,
      className: "border-red-200 bg-red-50 text-red-800",
    },
    {
      label: "Occurrences Today",
      value: todayOccurrenceLogs.length,
      className: "border-sky-200 bg-sky-50 text-sky-800",
    },
    {
      label: "Patrols",
      value: todayPatrols,
      className: "border-slate-200 bg-slate-50 text-slate-800",
    },
    {
      label: "Vehicle Checks",
      value: todayVehicleChecks,
      className: "border-blue-200 bg-blue-50 text-blue-800",
    },
    {
      label: "Welfare Checks",
      value: todayWelfareChecks,
      className: "border-purple-200 bg-purple-50 text-purple-800",
    },
    {
      label: "Lock / Unlocks",
      value: todayLockUnlocks,
      className: "border-green-200 bg-green-50 text-green-800",
    },
    {
      label: "Action Required",
      value: todayActionRequired,
      className: "border-yellow-200 bg-yellow-50 text-yellow-900",
    },
  ];

  const hasActivePriority = priorityLogs.length > 0;

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <img
              src="/logo.png"
              alt="SMSW Logo"
              className="h-14 w-auto object-contain"
            />

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                SMSW Operational Dashboard
              </h1>
              <p className="text-sm font-semibold tracking-wide text-slate-600">
                Live Incident Command Centre
              </p>
            </div>
          </div>
        </div>

        {hasActivePriority && (
          <div className="mb-4 rounded-lg border border-red-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Active Incidents Requiring Action
                </h2>
                <p className="text-xs text-slate-600">
                  Priority queue sorted by severity, emergency services, follow-up, and age.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
                  Critical {criticalOpenCount}
                </span>

                <span className="rounded-md border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800">
                  Emergency {emergencyOpenCount}
                </span>

                <span className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-900">
                  Follow-up {followUpOpenCount}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {priorityLogs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => openReportFromFeed(log.id)}
                  className={`flex flex-col gap-2 rounded-md border p-3 text-left hover:brightness-[0.98] md:flex-row md:items-center md:justify-between ${getPriorityClasses(
                    log
                  )}`}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-3">
                    <span className="w-fit shrink-0 rounded bg-white/80 px-2 py-0.5 text-[11px] font-black">
                      {getPriorityReason(log)}
                    </span>

                    <span className="shrink-0 text-sm font-bold">
                      {log.site_location || "Unknown Site"}
                    </span>

                    <span className="shrink-0 text-xs font-semibold">
                      Officer: {log.officer_name || "N/A"}
                    </span>

                    <span className="line-clamp-1 text-xs leading-4 opacity-80">
                      {log.description || "No description provided"}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-[11px] font-bold">
                    <span>{log.incident_time || ""}</span>
                    <span className="rounded bg-white/80 px-2 py-0.5">
                      Open {getIncidentAge(log.created_at)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          className="mb-3 w-full rounded border border-slate-300 bg-white p-3 text-sm text-black placeholder-slate-500 shadow-sm"
          placeholder="Search by site, officer, location, log number, severity, status, service, CAD/log number, occurrence type, priority, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={showOpenOnly}
                onChange={(e) => setShowOpenOnly(e.target.checked)}
                className="h-4 w-4"
              />
              Show open reports only
            </label>

            {lastUpdated && (
              <span className="w-fit rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                Updated <span className="font-black text-slate-900">{lastUpdated}</span>
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {commandStats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-lg border px-4 py-3 ${stat.className}`}
              >
                <p className="text-[11px] font-black uppercase tracking-wide">
                  {stat.label}
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className={`text-3xl font-black leading-none ${stat.valueClassName}`}>
                    {stat.value}
                  </p>
                  <p className="text-right text-[11px] font-semibold opacity-75">
                    {stat.helper}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Control Room Activity Feed
              </h2>
              <p className="text-xs text-slate-600">
                Latest incident and occurrence activity from the live reporting system.
              </p>
            </div>

            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
              Live Feed
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {combinedActivityLogs.map((item) => {
              if (item.type === "incident") {
                const log = item.data;

                return (
                  <button
                    key={`incident-${log.id}`}
                    type="button"
                    onClick={() => openReportFromFeed(log.id)}
                    className="grid w-full grid-cols-1 gap-2 py-2.5 text-left hover:bg-slate-50 md:grid-cols-[70px_155px_minmax(140px,220px)_1fr_105px] md:items-center md:gap-3"
                  >
                    <span className="text-xs font-bold tabular-nums text-slate-500">
                      {formatTime(log.created_at)}
                    </span>

                    <span
                      className={`inline-flex h-7 w-[155px] shrink-0 items-center justify-center rounded border px-2 text-[11px] font-bold ${getActivityClasses(
                        log
                      )}`}
                    >
                      {getActivityType(log)}
                    </span>

                    <span className="truncate text-xs font-bold text-slate-900">
                      {log.site_location || "Unknown Site"}
                    </span>

                    <span className="line-clamp-1 text-xs text-slate-600">
                      {log.description || "No description provided"}
                    </span>

                    <span
                      className={`inline-flex h-7 items-center justify-center rounded px-2 text-[11px] font-bold ${
                        isLogOpen(log)
                          ? "bg-slate-100 text-slate-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {isLogOpen(log) ? `Open ${getIncidentAge(log.created_at)}` : "Closed"}
                    </span>
                  </button>
                );
              }

              const occurrence = item.data;

              return (
                <button
                  key={`occurrence-${occurrence.id}`}
                  type="button"
                  onClick={() => {
                    setOccurrencesCollapsed(false);
                    setExpandedOccurrenceId(occurrence.id);

                    setTimeout(() => {
                      const occurrenceElement = document.getElementById(
                        `occurrence-${occurrence.id}`
                      );
                      occurrenceElement?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }, 150);
                  }}
                  className="grid w-full grid-cols-1 gap-2 py-2.5 text-left hover:bg-slate-50 md:grid-cols-[70px_155px_minmax(140px,220px)_1fr_105px] md:items-center md:gap-3"
                >
                  <span className="text-xs font-bold tabular-nums text-slate-500">
                    {getOccurrenceDisplayTime(occurrence)}
                  </span>

                  <span
                    className={`inline-flex h-7 w-[155px] shrink-0 items-center justify-center rounded border px-2 text-[11px] font-bold ${getOccurrenceActivityClasses(
                      occurrence
                    )}`}
                  >
                    {getOccurrenceActivityType(occurrence)}
                  </span>

                  <span className="truncate text-xs font-bold text-slate-900">
                    {occurrence.site_location || "Unknown Site"}
                  </span>

                  <span className="line-clamp-1 text-xs text-slate-600">
                    {occurrence.details || "No details provided"}
                  </span>

                  <span className="inline-flex h-7 items-center justify-center rounded bg-slate-100 px-2 text-[11px] font-bold text-slate-700">
                    Occurrence
                  </span>
                </button>
              );
            })}

            {combinedActivityLogs.length === 0 && (
              <div className="py-3 text-sm text-slate-600">
                No activity to show yet.
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setStatsCollapsed(!statsCollapsed)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Operational Statistics
              </h2>
              <p className="text-xs text-slate-600">
                Today's incidents, occurrence activity, patrols and operational coverage.
              </p>
            </div>

            <span className="rounded border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
              {statsCollapsed ? "Show" : "Hide"}
            </span>
          </button>

          {!statsCollapsed && (
            <>
              <div className="mt-3 grid gap-2 md:grid-cols-4 lg:grid-cols-7">
                {shiftStats.map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-md border px-3 py-2 ${stat.className}`}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-xl font-black">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Most Active Site
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {mostActiveSite}
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Most Active Officer
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {mostActiveOfficer}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[180px_90px_1.35fr_0.9fr_0.85fr_2.4fr_120px_45px] gap-3 border-b bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white md:grid">
            <div>Status</div>
            <div>Severity</div>

            <button
              type="button"
              onClick={() => setReportsCollapsed(!reportsCollapsed)}
              className="flex items-center gap-2 text-left font-semibold text-white hover:text-sky-200"
              title={reportsCollapsed ? "Show reports" : "Hide reports"}
            >
              <span>Site</span>
              <span className="text-xs">{reportsCollapsed ? "▼" : "▲"}</span>
            </button>

            <div>Officer</div>
            <div>Incident Time</div>
            <div>Summary</div>
            <div>Actions</div>
            <div>Open</div>
          </div>

          {reportsCollapsed ? (
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold text-slate-600">
              Reports hidden. Click the arrow next to Site to show them again.
            </div>
          ) : (
            <>
              {paginatedLogs.map((log) => {
                const status = log.status || "Open";
                const severity = log.severity || "Low";
                const isOpen = status === "Open";
                const isExpanded = expandedId === log.id;
                const intelligenceBadges = getIntelligenceBadges(log, severity);
                const reportAuditLogs = getAuditForLog(log);

                const photos: string[] =
                  Array.isArray(log.photo_urls) && log.photo_urls.length > 0
                    ? log.photo_urls
                    : log.photo_url
                    ? [log.photo_url]
                    : [];

                return (
                  <div
                    id={`report-${log.id}`}
                    key={log.id}
                    className={`scroll-mt-4 border-b border-slate-200 ${getSeverityBorder(
                      severity
                    )} ${getRowBackground(isOpen, severity)}`}
                  >
                    <div className="grid gap-3 px-3 py-2.5 md:grid-cols-[180px_90px_1.35fr_0.9fr_0.85fr_2.4fr_120px_45px] md:items-center">
                      <div className="flex w-[150px] flex-col items-start gap-1.5">
                        <span
                          className={`inline-flex h-7 w-[150px] items-center rounded px-2 text-xs font-bold text-white ${
                            isOpen ? "bg-red-600" : "bg-green-600"
                          }`}
                        >
                          <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px]">
                            {isOpen ? "!" : "✓"}
                          </span>
                          {status}
                        </span>

                        {isOpen && (
                          <span className="inline-flex h-7 w-[150px] items-center rounded border border-slate-300 bg-white/80 px-2 text-[11px] font-bold text-slate-700">
                            Open {getIncidentAge(log.created_at)}
                          </span>
                        )}

                        {intelligenceBadges.length > 0 &&
                          intelligenceBadges.slice(0, 2).map((badge) => (
                            <span
                              key={badge.label}
                              className={`inline-flex h-7 w-[150px] items-center rounded px-2 text-[11px] font-semibold leading-tight ${badge.className}`}
                            >
                              <span className="mr-2 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/70 text-[10px] font-bold">
                                {badge.icon}
                              </span>
                              <span className="truncate">{badge.label}</span>
                            </span>
                          ))}
                      </div>

                      <div>
                        <span
                          className={`inline-flex min-w-[56px] justify-center rounded px-3 py-1 text-xs font-bold ${getSeverityClasses(
                            severity
                          )}`}
                        >
                          {severity}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          {log.site_location || "Unknown Site"}
                        </p>
                        <div className="text-xs leading-4 text-slate-500">
                          <p>Site ID: {log.site_id || "N/A"}</p>
                          <p>Log: {log.log_number || "N/A"}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          {log.officer_name || "N/A"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {log.officer_id || ""}
                        </p>
                      </div>

                      <div className="text-[13px]">
                        <p>{log.incident_date || "N/A"}</p>
                        <p className="text-xs text-slate-500">
                          {log.incident_time || ""}
                        </p>
                      </div>

                      <div className="text-[12px] leading-4 text-slate-700">
                        <p className="line-clamp-2">
                          {log.description || "No description provided"}
                        </p>
                      </div>

                      <div className="flex max-w-[105px] flex-col gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            window.open(`/dashboard/report/${log.id}`, "_blank")
                          }
                          className="rounded bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          Report
                        </button>

                        {isOpen ? (
                          <button
                            type="button"
                            onClick={() => updateStatus(log.id, "Closed")}
                            className="rounded bg-green-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-800"
                          >
                            Close
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateStatus(log.id, "Open")}
                            className="rounded bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            Reopen
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteLog(log.id)}
                          className="rounded bg-red-800 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-900"
                        >
                          Delete
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="flex h-9 w-9 items-center justify-center rounded border border-slate-400 bg-white text-sm font-bold hover:bg-slate-100"
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50 p-4">
                        {intelligenceBadges.length > 0 && (
                          <div className="mb-4">
                            <h3 className="mb-2 text-sm font-bold">
                              Operational Alerts
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {intelligenceBadges.map((badge) => (
                                <span
                                  key={badge.label}
                                  className={`rounded px-3 py-1 text-sm font-semibold ${badge.className}`}
                                >
                                  {badge.icon} {badge.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid gap-4 text-sm md:grid-cols-2">
                          <div>
                            <h3 className="mb-2 font-bold">Incident Details</h3>

                            <p>
                              <strong>Severity:</strong>{" "}
                              <span
                                className={`inline-block rounded px-2 py-1 text-xs font-bold ${getSeverityClasses(
                                  severity
                                )}`}
                              >
                                {severity}
                              </span>
                            </p>

                            <p>
                              <strong>Incident Age:</strong>{" "}
                              {isOpen ? getIncidentAge(log.created_at) : "Closed"}
                            </p>

                            <p>
                              <strong>Exact Location:</strong>{" "}
                              {log.exact_location || "N/A"}
                            </p>

                            <p>
                              <strong>Persons Involved:</strong>{" "}
                              {log.persons_involved || "N/A"}
                            </p>

                            <p>
                              <strong>Duty Role:</strong> {log.duty_role || "N/A"}
                            </p>

                            <p>
                              <strong>Created:</strong>{" "}
                              {log.created_at
                                ? new Date(log.created_at).toLocaleString()
                                : "N/A"}
                            </p>
                          </div>

                          <div>
                            <h3 className="mb-2 font-bold">
                              Notifications & Actions
                            </h3>

                            <p>
                              <strong>Emergency Services:</strong>{" "}
                              {log.emergency_services ? "Yes" : "No"}
                            </p>

                            {log.emergency_services && (
                              <>
                                <p>
                                  <strong>Service:</strong>{" "}
                                  {log.emergency_service_type || "N/A"}
                                </p>

                                <p>
                                  <strong>CAD / Log Number:</strong>{" "}
                                  {log.emergency_service_log_number || "N/A"}
                                </p>
                              </>
                            )}

                            <p>
                              <strong>Supervisor Notified:</strong>{" "}
                              {log.supervisor_notified ? "Yes" : "No"}
                            </p>

                            <p>
                              <strong>Client Notified:</strong>{" "}
                              {log.client_notified ? "Yes" : "No"}
                            </p>

                            <p>
                              <strong>Follow-up Required:</strong>{" "}
                              {log.follow_up_required ? "Yes" : "No"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 text-sm">
                          <h3 className="mb-2 font-bold">Description</h3>
                          <p className="rounded border border-slate-200 bg-white p-3">
                            {log.description || "No description provided"}
                          </p>
                        </div>

                        <div className="mt-4 text-sm">
                          <h3 className="mb-2 font-bold">Action Taken</h3>
                          <p className="rounded border border-slate-200 bg-white p-3">
                            {log.action_taken || "No action recorded"}
                          </p>
                        </div>

                        <div className="mt-4 rounded border border-slate-200 bg-white p-3 text-sm">
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="font-bold">Audit History</h3>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                              {reportAuditLogs.length} entries
                            </span>
                          </div>

                          {reportAuditLogs.length > 0 ? (
                            <div className="divide-y divide-slate-200">
                              {reportAuditLogs.map((audit) => (
                                <div
                                  key={audit.id}
                                  className="grid gap-2 py-2 text-xs md:grid-cols-[145px_160px_1fr_120px]"
                                >
                                  <span className="font-semibold text-slate-500">
                                    {formatDateTime(audit.created_at)}
                                  </span>

                                  <span className="font-bold text-slate-900">
                                    {audit.action || "Audit Action"}
                                  </span>

                                  <span className="text-slate-600">
                                    {audit.details || "No additional details"}
                                  </span>

                                  <span className="font-semibold text-slate-500">
                                    {audit.performed_by || "Control Room"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                              No audit history recorded for this report yet.
                            </p>
                          )}
                        </div>

                        <div className="mt-4 rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span>
                              <strong>Report ID:</strong>{" "}
                              {log.log_number || "N/A"}
                            </span>
                            <span>
                              <strong>Status:</strong> {status}
                            </span>
                            <span>
                              <strong>Incident Age:</strong>{" "}
                              {isOpen ? getIncidentAge(log.created_at) : "Closed"}
                            </span>
                            <span>
                              <strong>Created:</strong>{" "}
                              {log.created_at
                                ? new Date(log.created_at).toLocaleString()
                                : "N/A"}
                            </span>
                            <span>
                              <strong>Last Dashboard Update:</strong>{" "}
                              {lastUpdated || "N/A"}
                            </span>
                          </div>
                        </div>

                        {photos.length > 0 && (
                          <div className="mt-4">
                            <h3 className="mb-2 text-sm font-bold">
                              Photo Evidence ({photos.length})
                            </h3>

                            <div className="flex flex-wrap gap-2">
                              {photos.map((photo: string, index: number) => (
                                <button
                                  key={photo}
                                  type="button"
                                  onClick={() => setSelectedImage(photo)}
                                >
                                  <img
                                    src={photo}
                                    alt={`Incident photo ${index + 1}`}
                                    className="h-24 w-24 cursor-pointer rounded border border-slate-300 bg-white object-contain p-1 hover:opacity-80"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredLogs.length > reportsPerPage && (
                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
                  <p className="font-semibold text-slate-600">
                    Showing {reportStartIndex + 1}-
                    {Math.min(reportStartIndex + reportsPerPage, filteredLogs.length)} of {filteredLogs.length} reports
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedId(null);
                        setReportPage((current) => Math.max(1, current - 1));
                      }}
                      disabled={safeReportPage === 1}
                      className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <span className="rounded bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
                      Page {safeReportPage} of {totalReportPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setExpandedId(null);
                        setReportPage((current) =>
                          Math.min(totalReportPages, current + 1)
                        );
                      }}
                      disabled={safeReportPage === totalReportPages}
                      className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {filteredLogs.length === 0 && (
                <div className="p-6 text-center text-sm">No reports found.</div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b bg-slate-950 px-4 py-3 text-white">
            <div>
              <h2 className="text-sm font-bold">Occurrence Logs</h2>
              <p className="text-xs text-slate-300">
                Patrols, site visits, vehicle checks, welfare visits, lock/unlocks and routine operational activity
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOccurrencesCollapsed(!occurrencesCollapsed)}
              className="rounded bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20"
            >
              {occurrencesCollapsed ? "Show" : "Hide"}
            </button>
          </div>

          {!occurrencesCollapsed && (
            <>
              <div className="hidden grid-cols-[90px_170px_1.2fr_0.9fr_140px_180px] gap-3 border-b bg-slate-100 px-4 py-2 text-xs font-bold uppercase text-slate-700 md:grid">
                <div>Time</div>
                <div>Type</div>
                <div>Site</div>
                <div>Officer</div>
                <div>Priority</div>
                <div>Actions</div>
              </div>

              {filteredOccurrenceLogs.map((log) => {
                const isExpanded = expandedOccurrenceId === log.id;
                const photos: string[] =
                  Array.isArray(log.photo_urls) && log.photo_urls.length > 0
                    ? log.photo_urls
                    : [];

                return (
                  <div
                    id={`occurrence-${log.id}`}
                    key={log.id}
                    className="scroll-mt-4 border-b border-slate-200 bg-white"
                  >
                    <div className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[90px_170px_1.2fr_0.9fr_140px_180px] md:items-center">
                      <div className="text-xs font-bold text-slate-600">
                        {getOccurrenceDisplayTime(log)}
                      </div>

                      <div>
                        <span className="inline-flex w-[140px] justify-center rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-800">
                          {log.occurrence_type || "Occurrence"}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {log.site_location || "Unknown Site"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Site ID: {log.site_id || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {log.officer_name || "Unknown Officer"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {log.officer_id || ""}
                        </p>
                      </div>

                      <div>
                        <span
                          className={`inline-flex w-[120px] justify-center rounded border px-2 py-1 text-xs font-bold ${getOccurrencePriorityClasses(
                            log.priority
                          )}`}
                        >
                          {log.priority || "Routine"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOccurrenceId(isExpanded ? null : log.id)
                          }
                          className="w-20 rounded border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteOccurrenceLog(log.id)}
                          className="w-20 rounded border border-red-300 bg-red-50 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50 p-4">
                        <div className="grid gap-4 text-sm md:grid-cols-2">
                          <div>
                            <h3 className="mb-2 font-bold">Occurrence Details</h3>

                            <p>
                              <strong>Date:</strong>{" "}
                              {log.occurrence_date || "N/A"}
                            </p>

                            <p>
                              <strong>Time:</strong>{" "}
                              {getOccurrenceDisplayTime(log)}
                            </p>

                            <p>
                              <strong>Type:</strong>{" "}
                              {log.occurrence_type || "Occurrence"}
                            </p>

                            <p>
                              <strong>Priority:</strong>{" "}
                              {log.priority || "Routine"}
                            </p>

                            <p>
                              <strong>Exact Location:</strong>{" "}
                              {log.exact_location || "N/A"}
                            </p>
                          </div>

                          <div>
                            <h3 className="mb-2 font-bold">Officer / Site</h3>

                            <p>
                              <strong>Officer:</strong>{" "}
                              {log.officer_name || "Unknown Officer"}
                            </p>

                            <p>
                              <strong>Officer ID:</strong>{" "}
                              {log.officer_id || "N/A"}
                            </p>

                            <p>
                              <strong>Site:</strong>{" "}
                              {log.site_location || "Unknown Site"}
                            </p>

                            <p>
                              <strong>Site ID:</strong> {log.site_id || "N/A"}
                            </p>

                            <p>
                              <strong>Submitted:</strong>{" "}
                              {log.created_at
                                ? new Date(log.created_at).toLocaleString()
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 text-sm">
                          <h3 className="mb-2 font-bold">Details / Observation</h3>
                          <p className="rounded border border-slate-200 bg-white p-3">
                            {log.details || "No details provided"}
                          </p>
                        </div>

                        <div className="mt-4 rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span>
                              <strong>Occurrence ID:</strong> {log.id || "N/A"}
                            </span>
                            <span>
                              <strong>Priority:</strong>{" "}
                              {log.priority || "Routine"}
                            </span>
                            <span>
                              <strong>Type:</strong>{" "}
                              {log.occurrence_type || "Occurrence"}
                            </span>
                            <span>
                              <strong>Submitted:</strong>{" "}
                              {log.created_at
                                ? new Date(log.created_at).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>

                        {photos.length > 0 && (
                          <div className="mt-4">
                            <h3 className="mb-2 text-sm font-bold">
                              Photo Evidence ({photos.length})
                            </h3>

                            <div className="flex flex-wrap gap-2">
                              {photos.map((photo: string, index: number) => (
                                <button
                                  key={photo}
                                  type="button"
                                  onClick={() => setSelectedImage(photo)}
                                >
                                  <img
                                    src={photo}
                                    alt={`Occurrence photo ${index + 1}`}
                                    className="h-24 w-24 cursor-pointer rounded border border-slate-300 bg-white object-contain p-1 hover:opacity-80"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredOccurrenceLogs.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500">
                  No occurrence logs found.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-full max-w-5xl">
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-2 top-2 rounded bg-white px-3 py-1 text-sm font-bold text-black"
            >
              Close
            </button>

            <img
              src={selectedImage}
              alt="Full size"
              className="max-h-[90vh] max-w-full rounded bg-white object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </main>
  );
}