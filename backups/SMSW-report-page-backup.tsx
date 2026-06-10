"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useParams } from "next/navigation";

export default function ReportPage() {
  const params = useParams();
  const id = params.id;

  const [log, setLog] = useState<any>(null);

  async function fetchLog() {
    const { data, error } = await supabase
      .from("event_logs")
      .select("*")
      .eq("id", id)
      .single();

    if (!error) setLog(data);
  }

  useEffect(() => {
    if (id) fetchLog();
  }, [id]);

  if (!log) {
    return <div className="p-6">Loading report...</div>;
  }

  const photos: string[] =
    Array.isArray(log.photo_urls) && log.photo_urls.length > 0
      ? log.photo_urls
      : log.photo_url
      ? [log.photo_url]
      : [];

  return (
    <main className="bg-gray-200 p-4 print:bg-white">
      <div className="mx-auto max-w-3xl bg-white p-6 shadow print:shadow-none">
        <div className="mb-6 flex items-center gap-4 border-b pb-4">
          <img
            src="/logo.png"
            alt="SMSW Logo"
            className="h-16 w-auto object-contain"
          />

          <div>
            <h1 className="text-2xl font-bold">SMSW Incident Report</h1>
            <p className="text-sm text-gray-600">
              Security Management South West Ltd
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
          <p>
            <strong>Site:</strong> {log.site_location || "N/A"}
          </p>
          <p>
            <strong>Site ID:</strong> {log.site_id || "N/A"}
          </p>
          <p>
            <strong>Log Number:</strong> {log.log_number || "N/A"}
          </p>
          <p>
            <strong>Status:</strong> {log.status || "Open"}
          </p>
          <p>
            <strong>Severity:</strong> {log.severity || "Low"}
          </p>
        </div>

        <div className="mb-4">
          <h2 className="mb-1 border-b font-bold">Officer Details</h2>
          <p>
            <strong>Name:</strong> {log.officer_name || "N/A"}
          </p>
          <p>
            <strong>ID / Call Sign:</strong> {log.officer_id || "N/A"}
          </p>
          <p>
            <strong>Role:</strong> {log.duty_role || "N/A"}
          </p>
        </div>

        <div className="mb-4">
          <h2 className="mb-1 border-b font-bold">Incident Details</h2>
          <p>
            <strong>Date:</strong> {log.incident_date || "N/A"}
          </p>
          <p>
            <strong>Time:</strong> {log.incident_time || "N/A"}
          </p>
          <p>
            <strong>Exact Location:</strong> {log.exact_location || "N/A"}
          </p>
          <p>
            <strong>Persons Involved:</strong> {log.persons_involved || "N/A"}
          </p>
        </div>

        <div className="mb-4">
          <h2 className="mb-1 border-b font-bold">Description</h2>
          <p>{log.description || "No description provided"}</p>
        </div>

        <div className="mb-4">
          <h2 className="mb-1 border-b font-bold">Action Taken</h2>
          <p>{log.action_taken || "No action recorded"}</p>
        </div>

        <div className="mb-4 text-sm">
          <h2 className="mb-1 border-b font-bold">Notifications & Actions</h2>

          <p>
            <strong>Emergency Services:</strong>{" "}
            {log.emergency_services ? "Yes" : "No"}
          </p>

          {log.emergency_services && (
            <>
              <p>
                <strong>Emergency Service:</strong>{" "}
                {log.emergency_service_type || "N/A"}
              </p>
              <p>
                <strong>Emergency Service Log / CAD Number:</strong>{" "}
                {log.emergency_service_log_number || "N/A"}
              </p>
            </>
          )}

          <p>
            <strong>Supervisor Notified:</strong>{" "}
            {log.supervisor_notified ? "Yes" : "No"}
          </p>
          <p>
            <strong>Client Notified:</strong> {log.client_notified ? "Yes" : "No"}
          </p>
          <p>
            <strong>Follow-up Required:</strong>{" "}
            {log.follow_up_required ? "Yes" : "No"}
          </p>
        </div>

        {photos.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 border-b font-bold">Photo Evidence</h2>
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo: string) => (
                <img
                  key={photo}
                  src={photo}
                  alt="Evidence"
                  className="w-full rounded border object-contain"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 border-t pt-4 text-sm text-gray-500">
          <p>Report generated: {new Date().toLocaleString()}</p>
        </div>

        <div className="mt-6 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded bg-black px-6 py-3 font-semibold text-white"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>
    </main>
  );
}