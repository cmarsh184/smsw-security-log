"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { supabase } from "../lib/supabase";

function generateLogNumber() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);

  return `SMSW-${year}${month}${day}-${random}`;
}

const emptyForm = {
  site_location: "",
  site_id: "",
  officer_name: "",
  officer_id: "",
  duty_role: "",
  log_number: "",
  severity: "Low",
  incident_date: "",
  incident_time: "",
  exact_location: "",
  persons_involved: "",
  description: "",
  action_taken: "",
  emergency_services: false,
  emergency_service_type: "",
  emergency_service_log_number: "",
  supervisor_notified: false,
  client_notified: false,
  follow_up_required: false,
  photo_url: "",
  photo_urls: [] as string[],
};

export default function Home() {
  const [form, setForm] = useState({
    ...emptyForm,
    log_number: generateLogNumber(),
  });

  const [files, setFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [message, setMessage] = useState("");

  const inputStyle =
    "w-full rounded border border-gray-400 bg-white p-3 text-black placeholder-gray-500";

  async function compressPhoto(file: File) {
    return await imageCompression(file, {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      initialQuality: 0.7,
    });
  }

  async function uploadPhotos() {
    if (files.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        setMessage(
          `Compressing photo ${uploadedUrls.length + 1} of ${files.length}...`
        );

        const compressedFile = await compressPhoto(file);

        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}-${file.name}`;

        setMessage(
          `Uploading photo ${uploadedUrls.length + 1} of ${files.length}...`
        );

        const { error } = await supabase.storage
          .from("incident-photos")
          .upload(fileName, compressedFile);

        if (error) {
          console.error(error);
          continue;
        }

        const { data } = supabase.storage
          .from("incident-photos")
          .getPublicUrl(fileName);

        uploadedUrls.push(data.publicUrl);
      } catch (error) {
        console.error("Photo compression/upload failed:", error);
      }
    }

    return uploadedUrls;
  }

  async function submitLog(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Submitting report...");

    const uploadedPhotoUrls = await uploadPhotos();

    const reportPayload = {
      ...form,
      photo_url: uploadedPhotoUrls[0] || "",
      photo_urls: uploadedPhotoUrls,
    };

    const { error } = await supabase.from("event_logs").insert([reportPayload]);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      const shouldSendAlert =
        reportPayload.severity === "Critical" ||
        reportPayload.emergency_services ||
        reportPayload.follow_up_required;

      if (shouldSendAlert) {
        try {
          setMessage("Report submitted. Sending alert email...");

          const response = await fetch("/api/send-incident-alert", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(reportPayload),
          });

          if (!response.ok) {
            throw new Error("Alert email request failed.");
          }

          setMessage("Report submitted successfully. Alert email sent.");
        } catch (alertError) {
          console.error("Alert email failed:", alertError);
          setMessage(
            "Report submitted successfully, but the alert email could not be sent."
          );
        }
      } else {
        setMessage("Report submitted successfully.");
      }

      setForm({
        ...emptyForm,
        log_number: generateLogNumber(),
      });

      setFiles([]);
      setFileInputKey((current) => current + 1);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 text-black">
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-300 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center gap-4 border-b pb-4">
          <img
            src="/logo.png"
            alt="SMSW Logo"
            className="h-14 w-auto object-contain"
          />

          <div>
            <h1 className="text-2xl font-bold text-black">
              SMSW Incident Report
            </h1>
            <p className="text-sm text-gray-600">
              Security Management South West Ltd
            </p>
          </div>
        </div>

        <form onSubmit={submitLog} className="space-y-4">
          <p className="font-semibold text-black">Site Details</p>

          <input
            className={inputStyle}
            placeholder="Site / Location"
            value={form.site_location}
            onChange={(e) =>
              setForm({ ...form, site_location: e.target.value })
            }
            required
          />

          <input
            className={inputStyle}
            placeholder="Site ID"
            value={form.site_id}
            onChange={(e) => setForm({ ...form, site_id: e.target.value })}
          />

          <p className="mt-4 font-semibold text-black">Officer Details</p>

          <input
            className={inputStyle}
            placeholder="Officer Name"
            value={form.officer_name}
            onChange={(e) =>
              setForm({ ...form, officer_name: e.target.value })
            }
            required
          />

          <input
            className={inputStyle}
            placeholder="Officer ID / Call Sign"
            value={form.officer_id}
            onChange={(e) => setForm({ ...form, officer_id: e.target.value })}
          />

          <select
            className={inputStyle}
            value={form.duty_role}
            onChange={(e) => setForm({ ...form, duty_role: e.target.value })}
            required
          >
            <option value="">Select Duty Role</option>
            <option value="Security Officer">Security Officer</option>
            <option value="Event Officer">Event Officer</option>
            <option value="Traffic Management">Traffic Management</option>
            <option value="Event Steward">Event Steward</option>
          </select>

          <p className="mt-4 font-semibold text-black">Report Reference</p>

          <input
            className={`${inputStyle} bg-gray-100 font-semibold`}
            value={form.log_number}
            readOnly
          />

          <p className="mt-4 font-semibold text-black">Severity Level</p>

          <select
            className={inputStyle}
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            required
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <p className="mt-4 font-semibold text-black">Incident Details</p>

          <input
            type="date"
            className={inputStyle}
            value={form.incident_date}
            onChange={(e) =>
              setForm({ ...form, incident_date: e.target.value })
            }
            required
          />

          <input
            type="time"
            className={inputStyle}
            value={form.incident_time}
            onChange={(e) =>
              setForm({ ...form, incident_time: e.target.value })
            }
            required
          />

          <input
            className={inputStyle}
            placeholder="Exact Location"
            value={form.exact_location}
            onChange={(e) =>
              setForm({ ...form, exact_location: e.target.value })
            }
          />

          <textarea
            className={inputStyle}
            placeholder="Persons Involved"
            value={form.persons_involved}
            onChange={(e) =>
              setForm({ ...form, persons_involved: e.target.value })
            }
          />

          <textarea
            className={inputStyle}
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />

          <textarea
            className={inputStyle}
            placeholder="Action Taken"
            value={form.action_taken}
            onChange={(e) => setForm({ ...form, action_taken: e.target.value })}
          />

          <p className="mt-4 font-semibold text-black">Photo Evidence</p>

          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            multiple
            className={inputStyle}
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />

          {files.length > 0 && (
            <p className="text-sm text-gray-600">
              {files.length} photo(s) selected. Photos will be compressed before
              upload.
            </p>
          )}

          <p className="mt-4 font-semibold text-black">
            Notifications & Actions
          </p>

          <div className="space-y-3 text-black">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.emergency_services}
                onChange={(e) =>
                  setForm({
                    ...form,
                    emergency_services: e.target.checked,
                    emergency_service_type: e.target.checked
                      ? form.emergency_service_type
                      : "",
                    emergency_service_log_number: e.target.checked
                      ? form.emergency_service_log_number
                      : "",
                  })
                }
              />
              <span>Emergency Services Involved</span>
            </label>

            {form.emergency_services && (
              <div className="ml-7 space-y-3 rounded border border-gray-300 bg-gray-50 p-3">
                <select
                  className={inputStyle}
                  value={form.emergency_service_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      emergency_service_type: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Which Service?</option>
                  <option value="Police">Police</option>
                  <option value="Ambulance">Ambulance</option>
                  <option value="Fire Service">Fire Service</option>
                  <option value="Coastguard">Coastguard</option>
                  <option value="Local Authority">Local Authority</option>
                  <option value="Other">Other</option>
                </select>

                <input
                  className={inputStyle}
                  placeholder="Emergency Service Log / CAD Number"
                  value={form.emergency_service_log_number}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      emergency_service_log_number: e.target.value,
                    })
                  }
                />
              </div>
            )}

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.supervisor_notified}
                onChange={(e) =>
                  setForm({
                    ...form,
                    supervisor_notified: e.target.checked,
                  })
                }
              />
              <span>Supervisor Notified</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.client_notified}
                onChange={(e) =>
                  setForm({
                    ...form,
                    client_notified: e.target.checked,
                  })
                }
              />
              <span>Client Notified</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.follow_up_required}
                onChange={(e) =>
                  setForm({
                    ...form,
                    follow_up_required: e.target.checked,
                  })
                }
              />
              <span>Follow-up Required</span>
            </label>
          </div>

          <button className="w-full rounded-lg bg-black p-4 text-lg font-semibold text-white">
            Submit Report
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center font-medium text-black">{message}</p>
        )}
      </div>
    </main>
  );
}