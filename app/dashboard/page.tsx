"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchLogs() {
    const { data, error } = await supabase
      .from("event_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setLogs(data || []);
  }

  async function updateStatus(id: string, status: "Open" | "Closed") {
    const { error } = await supabase
      .from("event_logs")
      .update({ status })
      .eq("id", id);

    if (!error) fetchLogs();
    else alert("Could not update status: " + error.message);
  }

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) =>
    log.site_location?.toLowerCase().includes(search.toLowerCase()) ||
    log.officer_name?.toLowerCase().includes(search.toLowerCase()) ||
    log.description?.toLowerCase().includes(search.toLowerCase()) ||
    log.exact_location?.toLowerCase().includes(search.toLowerCase()) ||
    log.log_number?.toLowerCase().includes(search.toLowerCase()) ||
    log.status?.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = logs.filter((log) => (log.status || "Open") === "Open").length;
  const closedCount = logs.filter((log) => log.status === "Closed").length;

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 rounded-lg bg-white p-4 shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Control Room Dashboard</h1>
              <p className="text-sm text-gray-600">
                Live incident reports, review status, and photo evidence.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded bg-red-100 px-3 py-1 font-semibold text-red-700">
                Open: {openCount}
              </span>
              <span className="rounded bg-green-100 px-3 py-1 font-semibold text-green-700">
                Closed: {closedCount}
              </span>
              <span className="rounded bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                Refresh: 5s
              </span>
            </div>
          </div>
        </div>

        <input
          className="mb-4 w-full rounded border border-gray-400 bg-white p-3 text-black placeholder-gray-500"
          placeholder="Search by site, officer, location, log number, status, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="hidden grid-cols-[120px_1.5fr_1fr_1fr_2fr_140px_70px] gap-3 border-b bg-slate-900 p-3 text-sm font-semibold text-white md:grid">
            <div>Status</div>
            <div>Site</div>
            <div>Officer</div>
            <div>Incident Time</div>
            <div>Summary</div>
            <div>Actions</div>
            <div>Open</div>
          </div>

          {filteredLogs.map((log) => {
            const status = log.status || "Open";
            const isOpen = status === "Open";
            const isExpanded = expandedId === log.id;
            const isSerious = log.emergency_services || log.follow_up_required;

            const photos: string[] =
              Array.isArray(log.photo_urls) && log.photo_urls.length > 0
                ? log.photo_urls
                : log.photo_url
                ? [log.photo_url]
                : [];

            return (
              <div
                key={log.id}
                className={`border-b ${
                  isOpen ? "bg-red-50" : "bg-green-50"
                }`}
              >
                <div className="grid gap-3 p-3 md:grid-cols-[120px_1.5fr_1fr_1fr_2fr_140px_70px] md:items-center">
                  <div>
                    <span
                      className={`inline-block rounded px-3 py-1 text-xs font-bold text-white ${
                        isOpen ? "bg-red-600" : "bg-green-600"
                      }`}
                    >
                      {status}
                    </span>

                    {isSerious && (
                      <div className="mt-1 text-xs font-semibold text-orange-700">
                        Attention Required
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold">
                      {log.site_location || "Unknown Site"}
                    </p>
                    <p className="text-xs text-gray-600">
                      Site ID: {log.site_id || "N/A"} | Log:{" "}
                      {log.log_number || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p>{log.officer_name || "N/A"}</p>
                    <p className="text-xs text-gray-600">
                      {log.officer_id || ""}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p>{log.incident_date || "N/A"}</p>
                    <p className="text-xs text-gray-600">
                      {log.incident_time || ""}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="line-clamp-2">
                      {log.description || "No description provided"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        window.open(`/dashboard/report/${log.id}`, "_blank")
                      }
                      className="rounded bg-black px-3 py-2 text-sm font-semibold text-white"
                    >
                      View Report
                    </button>

                    {isOpen ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(log.id, "Closed")}
                        className="rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Mark Closed
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateStatus(log.id, "Open")}
                        className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Reopen
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : log.id)
                    }
                    className="rounded border bg-white px-3 py-2 text-xl font-bold hover:bg-gray-100"
                    aria-label="Expand report"
                  >
                    {isExpanded ? "▲" : "▼"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t bg-white p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="mb-2 font-bold">Incident Details</h3>
                        <p><strong>Exact Location:</strong> {log.exact_location || "N/A"}</p>
                        <p><strong>Persons Involved:</strong> {log.persons_involved || "N/A"}</p>
                        <p><strong>Duty Role:</strong> {log.duty_role || "N/A"}</p>
                        <p><strong>Created:</strong> {new Date(log.created_at).toLocaleString()}</p>
                      </div>

                      <div>
                        <h3 className="mb-2 font-bold">Notifications & Actions</h3>
                        <p><strong>Emergency Services:</strong> {log.emergency_services ? "Yes" : "No"}</p>
                        <p><strong>Supervisor Notified:</strong> {log.supervisor_notified ? "Yes" : "No"}</p>
                        <p><strong>Client Notified:</strong> {log.client_notified ? "Yes" : "No"}</p>
                        <p><strong>Follow-up Required:</strong> {log.follow_up_required ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="mb-2 font-bold">Description</h3>
                      <p className="rounded border bg-gray-50 p-3">
                        {log.description || "No description provided"}
                      </p>
                    </div>

                    <div className="mt-4">
                      <h3 className="mb-2 font-bold">Action Taken</h3>
                      <p className="rounded border bg-gray-50 p-3">
                        {log.action_taken || "No action recorded"}
                      </p>
                    </div>

                    {photos.length > 0 && (
                      <div className="mt-4">
                        <h3 className="mb-2 font-bold">
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
                                className="h-24 w-24 cursor-pointer rounded border bg-white object-contain p-1 hover:opacity-80"
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
            <div className="p-6 text-center">No reports found.</div>
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
              className="absolute right-2 top-2 rounded bg-white px-3 py-1 font-bold text-black"
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