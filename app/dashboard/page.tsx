"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

    if (!error) {
      fetchLogs();
    } else {
      alert("Could not update status: " + error.message);
    }
  }

  useEffect(() => {
    fetchLogs();

    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);

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
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 rounded-lg bg-white p-4 shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Control Room Dashboard</h1>
              <p className="text-sm text-gray-600">
                Live incident reports, review status, and photo evidence.
              </p>
            </div>

            <div className="flex gap-2 text-sm">
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

        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const status = log.status || "Open";
            const isOpen = status === "Open";
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
                className={`rounded-lg border p-4 shadow ${
                  isOpen
                    ? "border-red-300 bg-red-50"
                    : "border-green-300 bg-green-50"
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-3 py-1 text-sm font-bold text-white ${
                          isOpen ? "bg-red-600" : "bg-green-600"
                        }`}
                      >
                        {status}
                      </span>

                      {isSerious && (
                        <span className="rounded bg-orange-600 px-3 py-1 text-sm font-bold text-white">
                          Attention Required
                        </span>
                      )}

                      <span className="text-sm text-gray-600">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold">
                      {log.site_location || "Unknown Site"}
                    </h2>

                    <p className="text-sm text-gray-700">
                      <strong>Log:</strong> {log.log_number || "N/A"} |{" "}
                      <strong>Site ID:</strong> {log.site_id || "N/A"} |{" "}
                      <strong>Officer:</strong> {log.officer_name || "N/A"}{" "}
                      {log.officer_id ? `(${log.officer_id})` : ""}
                    </p>

                    <p className="text-sm text-gray-700">
                      <strong>Incident:</strong> {log.incident_date || "N/A"}{" "}
                      {log.incident_time || ""} |{" "}
                      <strong>Exact Location:</strong>{" "}
                      {log.exact_location || "N/A"}
                    </p>

                    <p className="mt-2">
                      <strong>Description:</strong>{" "}
                      {log.description || "No description provided"}
                    </p>

                    <p>
                      <strong>Action Taken:</strong>{" "}
                      {log.action_taken || "No action recorded"}
                    </p>

                    {photos.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 font-semibold">
                          Photo Evidence ({photos.length})
                        </p>

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

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {log.emergency_services && (
                        <span className="rounded bg-red-600 px-2 py-1 text-white">
                          Emergency Services
                        </span>
                      )}

                      {log.supervisor_notified && (
                        <span className="rounded bg-blue-600 px-2 py-1 text-white">
                          Supervisor Notified
                        </span>
                      )}

                      {log.client_notified && (
                        <span className="rounded bg-purple-600 px-2 py-1 text-white">
                          Client Notified
                        </span>
                      )}

                      {log.follow_up_required && (
                        <span className="rounded bg-yellow-500 px-2 py-1 text-white">
                          Follow-up Required
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex min-w-[180px] flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        window.open(`/dashboard/report/${log.id}`, "_blank")
                      }
                      className="rounded bg-black px-4 py-2 font-semibold text-white"
                    >
                      View Report
                    </button>

                    {isOpen ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(log.id, "Closed")}
                        className="rounded bg-green-600 px-4 py-2 font-semibold text-white"
                      >
                        Mark Closed
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateStatus(log.id, "Open")}
                        className="rounded bg-red-600 px-4 py-2 font-semibold text-white"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="rounded bg-white p-6 text-center shadow">
              No reports found.
            </div>
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