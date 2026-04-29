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
    log.log_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Control Room Dashboard</h1>
          <span className="text-sm text-green-700">
            Live refresh: every 5 seconds
          </span>
        </div>

        <input
          className="mb-4 w-full rounded border p-3"
          placeholder="Search by site, officer, location, log number, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const isSerious = log.emergency_services || log.follow_up_required;

            const photos =
              Array.isArray(log.photo_urls) && log.photo_urls.length > 0
                ? log.photo_urls
                : log.photo_url
                ? [log.photo_url]
                : [];

            return (
              <div
                key={log.id}
                className={`rounded-lg p-4 shadow ${
                  isSerious
                    ? "border-l-4 border-red-600 bg-red-100"
                    : "bg-white"
                }`}
              >
                <div className="flex justify-between gap-4">
                  <h2 className="text-lg font-bold">
                    {log.site_location || "Unknown Site"}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>

                <p><strong>Site ID:</strong> {log.site_id}</p>
                <p><strong>Log Number:</strong> {log.log_number}</p>
                <p><strong>Officer:</strong> {log.officer_name} ({log.officer_id})</p>
                <p><strong>Role:</strong> {log.duty_role}</p>
                <p><strong>Incident Time:</strong> {log.incident_date} {log.incident_time}</p>
                <p><strong>Exact Location:</strong> {log.exact_location}</p>
                <p><strong>Persons Involved:</strong> {log.persons_involved}</p>

                <p className="mt-2"><strong>Description:</strong> {log.description}</p>
                <p><strong>Action Taken:</strong> {log.action_taken}</p>

                {photos.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 font-semibold">
                      Photo Evidence ({photos.length}):
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {photos.map((photo, index) => (
                        <button
                          key={photo}
                          type="button"
                          onClick={() => setSelectedImage(photo)}
                          className="block"
                        >
                          <img
                            src={photo}
                            alt={`Incident evidence ${index + 1}`}
                            className="h-40 w-40 cursor-pointer rounded border bg-white object-contain p-1 hover:opacity-80"
                          />
                        </button>
                      ))}
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      Click any image to enlarge
                    </p>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-sm">
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
            );
          })}
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
              alt="Full size incident evidence"
              className="max-h-[90vh] max-w-full rounded bg-white object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </main>
  );
}