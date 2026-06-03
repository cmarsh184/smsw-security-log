"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [selectedSite, setSelectedSite] = useState("All Sites");
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  async function fetchLogs() {
    const { data, error } = await supabase
      .from("event_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setLogs(data || []);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }

  async function updateStatus(id: string, status: "Open" | "Closed") {
    const { error } = await supabase
      .from("event_logs")
      .update({ status })
      .eq("id", id);

    if (!error) fetchLogs();
    else alert("Could not update status: " + error.message);
  }

  async function deleteLog(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this report? This cannot be undone."
    );

    if (!confirmed) return;

    const { error } = await supabase.from("event_logs").delete().eq("id", id);

    if (!error) {
      if (expandedId === id) setExpandedId(null);
      fetchLogs();
    } else {
      alert("Could not delete report: " + error.message);
    }
  }

  function isLogOpen(log: any) {
    return (log.status || "Open") === "Open";
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
        return "bg-slate-100 text-slate-700";
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

    if (isOpen) {
      return "bg-red-50";
    }

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

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const siteOptions = useMemo(() => {
    const uniqueSites = Array.from(
      new Set(
        logs
          .map((log) => log.site_location)
          .filter((site) => typeof site === "string" && site.trim().length > 0)
      )
    ).sort();

    return ["All Sites", ...uniqueSites];
  }, [logs]);

  const openLogs = logs.filter((log) => isLogOpen(log));

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

  const filteredLogs = logs.filter((log) => {
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

    const matchesSite =
      selectedSite === "All Sites" || log.site_location === selectedSite;

    const matchesOpenOnly = !showOpenOnly || isLogOpen(log);

    return matchesSearch && matchesSite && matchesOpenOnly;
  });

  const stats = [
    {
      label: "Open",
      icon: "●",
      value: openCount,
      className: "border-red-200 bg-red-50 text-red-700",
    },
    {
      label: "Closed",
      icon: "✓",
      value: closedCount,
      className: "border-green-200 bg-green-50 text-green-700",
    },
    {
      label: "High",
      icon: "↑",
      value: highOpenCount,
      className: "border-orange-200 bg-orange-50 text-orange-700",
    },
    {
      label: "Critical",
      icon: "!",
      value: criticalOpenCount,
      className: "border-red-200 bg-red-100 text-red-800",
    },
    {
      label: "Emergency",
      icon: "+",
      value: emergencyOpenCount,
      className: "border-purple-200 bg-purple-50 text-purple-800",
    },
    {
      label: "Follow-up",
      icon: "!",
      value: followUpOpenCount,
      className: "border-yellow-200 bg-yellow-50 text-yellow-900",
    },
  ];

  const hasActivePriority =
    criticalOpenCount > 0 || emergencyOpenCount > 0 || followUpOpenCount > 0;

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
              <p className="text-sm text-slate-600">
                Live incident reports, review status, severity, and operational alerts.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {stats.map((stat) => (
                <span
                  key={stat.label}
                  className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold ${stat.className}`}
                >
                  <span className="font-bold">{stat.icon}</span>
                  <span>{stat.label}</span>
                  <span className="rounded bg-white/70 px-1.5 py-0.5 font-bold">
                    {stat.value}
                  </span>
                </span>
              ))}

              {lastUpdated && (
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  Updated
                  <span className="rounded bg-white/70 px-1.5 py-0.5 font-bold">
                    {lastUpdated}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {hasActivePriority && (
          <div className="mb-4 rounded-lg border border-red-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Active Priority
                </h2>
                <p className="text-xs text-slate-600">
                  Live incidents requiring operational attention.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
                  Critical: {criticalOpenCount}
                </span>

                <span className="rounded-md border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800">
                  Emergency: {emergencyOpenCount}
                </span>

                <span className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-900">
                  Follow-up: {followUpOpenCount}
                </span>
              </div>
            </div>
          </div>
        )}

        <input
          className="mb-3 w-full rounded border border-slate-300 bg-white p-3 text-sm text-black placeholder-slate-500 shadow-sm"
          placeholder="Search by site, officer, location, log number, severity, status, service, CAD/log number, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1 md:w-80">
              <label className="text-xs font-semibold text-slate-600">
                Site filter
              </label>

              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              >
                {siteOptions.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={showOpenOnly}
                onChange={(e) => setShowOpenOnly(e.target.checked)}
                className="h-4 w-4"
              />
              Show open reports only
            </label>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[180px_95px_1.4fr_1fr_1fr_2fr_120px_45px] gap-3 border-b bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white md:grid">
            <div>Status</div>
            <div>Severity</div>
            <div>Site</div>
            <div>Officer</div>
            <div>Incident Time</div>
            <div>Summary</div>
            <div>Actions</div>
            <div>Open</div>
          </div>

          {filteredLogs.map((log) => {
            const status = log.status || "Open";
            const severity = log.severity || "Low";
            const isOpen = status === "Open";
            const isExpanded = expandedId === log.id;
            const intelligenceBadges = getIntelligenceBadges(log, severity);

            const photos: string[] =
              Array.isArray(log.photo_urls) && log.photo_urls.length > 0
                ? log.photo_urls
                : log.photo_url
                ? [log.photo_url]
                : [];

            return (
              <div
                key={log.id}
                className={`border-b border-slate-200 ${getSeverityBorder(
                  severity
                )} ${getRowBackground(isOpen, severity)}`}
              >
                <div className="grid gap-3 px-3 py-2.5 md:grid-cols-[180px_95px_1.4fr_1fr_1fr_2fr_120px_45px] md:items-center">
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

                    {intelligenceBadges.length > 0 &&
                      intelligenceBadges.slice(0, 3).map((badge) => (
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
                    <p className="text-xs text-slate-500">
                      Site ID: {log.site_id || "N/A"} | Log:{" "}
                      {log.log_number || "N/A"}
                    </p>
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

                    <div className="mt-4 rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          <strong>Report ID:</strong> {log.log_number || "N/A"}
                        </span>
                        <span>
                          <strong>Status:</strong> {status}
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

          {filteredLogs.length === 0 && (
            <div className="p-6 text-center text-sm">No reports found.</div>
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