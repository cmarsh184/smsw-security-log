"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function OccurrenceLogPage() {
  const [officerName, setOfficerName] = useState("");
  const [officerId, setOfficerId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [occurrenceType, setOccurrenceType] = useState("Patrol Completed");
  const [priority, setPriority] = useState("Routine");
  const [exactLocation, setExactLocation] = useState("");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function uploadPhotos() {
    if (!photos || photos.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const photo of Array.from(photos)) {
      const fileExt = photo.name.split(".").pop();
      const fileName = `occurrence-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("incident-photos")
        .upload(fileName, photo);

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage
        .from("incident-photos")
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitted(false);

    try {
      const photoUrls = await uploadPhotos();

      const { error } = await supabase.from("occurrence_logs").insert({
        officer_name: officerName,
        officer_id: officerId,
        site_id: siteId,
        site_location: siteLocation,
        occurrence_type: occurrenceType,
        priority,
        exact_location: exactLocation,
        details,
        photo_urls: photoUrls,
      });

      if (error) {
        alert("Could not submit occurrence log: " + error.message);
        return;
      }

      setSubmitted(true);
      setOfficerName("");
      setOfficerId("");
      setSiteId("");
      setSiteLocation("");
      setOccurrenceType("Patrol Completed");
      setPriority("Routine");
      setExactLocation("");
      setDetails("");
      setPhotos(null);

      const fileInput = document.getElementById(
        "photos"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error: any) {
      alert("Could not submit occurrence log: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-black">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm">
          <img
            src="/logo.png"
            alt="SMSW Logo"
            className="mx-auto mb-3 h-14 w-auto object-contain"
          />

          <h1 className="text-2xl font-bold tracking-tight">
            SMSW Occurrence Log
          </h1>

          <p className="text-sm font-semibold tracking-wide text-slate-600">
            Patrols, site visits, checks, observations and routine activity
          </p>
        </div>

        {submitted && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">
            Occurrence log submitted successfully.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold">
                Officer Name
              </label>
              <input
                required
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="Officer name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Officer ID
              </label>
              <input
                value={officerId}
                onChange={(e) => setOfficerId(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="Officer ID"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Site ID
              </label>
              <input
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="Site ID"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Site / Location
              </label>
              <input
                required
                value={siteLocation}
                onChange={(e) => setSiteLocation(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="Site or location"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Occurrence Type
              </label>
              <select
                value={occurrenceType}
                onChange={(e) => setOccurrenceType(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white p-2 text-sm"
              >
                <option>Patrol Completed</option>
                <option>Site Visit</option>
                <option>Vehicle Check</option>
                <option>Welfare Check</option>
                <option>Lock-Up</option>
                <option>Unlock</option>
                <option>Keyholding Attendance</option>
                <option>Maintenance Issue</option>
                <option>Client Request</option>
                <option>Observation</option>
                <option>Shift Start</option>
                <option>Shift Finish</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white p-2 text-sm"
              >
                <option>Routine</option>
                <option>Information</option>
                <option>Action Required</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold">
              Exact Location
            </label>
            <input
              value={exactLocation}
              onChange={(e) => setExactLocation(e.target.value)}
              className="w-full rounded border border-slate-300 p-2 text-sm"
              placeholder="Example: rear car park, main entrance, plant room"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold">
              Details / Observation
            </label>
            <textarea
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-32 w-full rounded border border-slate-300 p-2 text-sm"
              placeholder="Enter patrol notes, visit details, vehicle check outcome, maintenance issue, handover note, or general observation..."
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold">
              Photo Evidence
            </label>
            <input
              id="photos"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setPhotos(e.target.files)}
              className="w-full rounded border border-slate-300 bg-white p-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Optional. Upload photos for patrol evidence, vehicle checks,
              damage, maintenance issues or site observations.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Occurrence Log"}
          </button>
        </form>
      </div>
    </main>
  );
}