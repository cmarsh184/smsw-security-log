"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [form, setForm] = useState({
    site_location: "",
    site_id: "",
    officer_name: "",
    officer_id: "",
    duty_role: "",
    log_number: "",
    incident_date: "",
    incident_time: "",
    exact_location: "",
    persons_involved: "",
    description: "",
    action_taken: "",
    emergency_services: false,
    supervisor_notified: false,
    client_notified: false,
    follow_up_required: false,
    photo_url: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function uploadPhoto() {
    if (!file) return "";

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("incident-photos")
      .upload(fileName, file);

    if (error) {
      console.error(error);
      return "";
    }

    const { data } = supabase.storage
      .from("incident-photos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function submitLog(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Submitting report...");

    const photoUrl = await uploadPhoto();

    const { error } = await supabase.from("event_logs").insert([
      {
        ...form,
        photo_url: photoUrl,
      },
    ]);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Report submitted successfully.");
      setFile(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold">SMSW Incident Report</h1>

        <form onSubmit={submitLog} className="space-y-4">
          <p className="font-semibold">Site Details</p>

          <input className="w-full rounded border p-3" placeholder="Site / Location"
            onChange={(e) => setForm({ ...form, site_location: e.target.value })} required />

          <input className="w-full rounded border p-3" placeholder="Site ID"
            onChange={(e) => setForm({ ...form, site_id: e.target.value })} />

          <p className="mt-4 font-semibold">Officer Details</p>

          <input className="w-full rounded border p-3" placeholder="Officer Name"
            onChange={(e) => setForm({ ...form, officer_name: e.target.value })} required />

          <input className="w-full rounded border p-3" placeholder="Officer ID / Call Sign"
            onChange={(e) => setForm({ ...form, officer_id: e.target.value })} />

          <input className="w-full rounded border p-3" placeholder="Duty Role"
            onChange={(e) => setForm({ ...form, duty_role: e.target.value })} />

          <input className="w-full rounded border p-3" placeholder="Log Number"
            onChange={(e) => setForm({ ...form, log_number: e.target.value })} />

          <p className="mt-4 font-semibold">Incident Details</p>

          <input type="date" className="w-full rounded border p-3"
            onChange={(e) => setForm({ ...form, incident_date: e.target.value })} required />

          <input type="time" className="w-full rounded border p-3"
            onChange={(e) => setForm({ ...form, incident_time: e.target.value })} required />

          <input className="w-full rounded border p-3" placeholder="Exact Location"
            onChange={(e) => setForm({ ...form, exact_location: e.target.value })} />

          <textarea className="w-full rounded border p-3" placeholder="Persons Involved"
            onChange={(e) => setForm({ ...form, persons_involved: e.target.value })} />

          <textarea className="w-full rounded border p-3" placeholder="Description"
            onChange={(e) => setForm({ ...form, description: e.target.value })} required />

          <textarea className="w-full rounded border p-3" placeholder="Action Taken"
            onChange={(e) => setForm({ ...form, action_taken: e.target.value })} />

          <p className="mt-4 font-semibold">Photo Evidence</p>

          <input
            type="file"
            accept="image/*"
            className="w-full rounded border p-3"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <p className="mt-4 font-semibold">Notifications & Actions</p>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox"
                onChange={(e) => setForm({ ...form, emergency_services: e.target.checked })} />
              Emergency Services Involved
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox"
                onChange={(e) => setForm({ ...form, supervisor_notified: e.target.checked })} />
              Supervisor Notified
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox"
                onChange={(e) => setForm({ ...form, client_notified: e.target.checked })} />
              Client Notified
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox"
                onChange={(e) => setForm({ ...form, follow_up_required: e.target.checked })} />
              Follow-up Required
            </label>
          </div>

          <button className="w-full rounded-lg bg-black p-4 text-lg text-white">
            Submit Report
          </button>
        </form>

        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </main>
  );
}