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

  const inputStyle =
    "w-full rounded border border-gray-400 bg-white p-3 text-black placeholder-gray-500";

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
    <main className="min-h-screen bg-gray-100 p-4 text-black">
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-300 bg-white p-6 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-black">SMSW Incident Report</h1>

        <form onSubmit={submitLog} className="space-y-4">
          <p className="font-semibold text-black">Site Details</p>

          <input className={inputStyle} placeholder="Site / Location"
            onChange={(e) => setForm({ ...form, site_location: e.target.value })} required />

          <input className={inputStyle} placeholder="Site ID"
            onChange={(e) => setForm({ ...form, site_id: e.target.value })} />

          <p className="mt-4 font-semibold text-black">Officer Details</p>

          <input className={inputStyle} placeholder="Officer Name"
            onChange={(e) => setForm({ ...form, officer_name: e.target.value })} required />

          <input className={inputStyle} placeholder="Officer ID / Call Sign"
            onChange={(e) => setForm({ ...form, officer_id: e.target.value })} />

          <input className={inputStyle} placeholder="Duty Role"
            onChange={(e) => setForm({ ...form, duty_role: e.target.value })} />

          <input className={inputStyle} placeholder="Log Number"
            onChange={(e) => setForm({ ...form, log_number: e.target.value })} />

          <p className="mt-4 font-semibold text-black">Incident Details</p>

          <input type="date" className={inputStyle}
            onChange={(e) => setForm({ ...form, incident_date: e.target.value })} required />

          <input type="time" className={inputStyle}
            onChange={(e) => setForm({ ...form, incident_time: e.target.value })} required />

          <input className={inputStyle} placeholder="Exact Location"
            onChange={(e) => setForm({ ...form, exact_location: e.target.value })} />

          <textarea className={inputStyle} placeholder="Persons Involved"
            onChange={(e) => setForm({ ...form, persons_involved: e.target.value })} />

          <textarea className={inputStyle} placeholder="Description"
            onChange={(e) => setForm({ ...form, description: e.target.value })} required />

          <textarea className={inputStyle} placeholder="Action Taken"
            onChange={(e) => setForm({ ...form, action_taken: e.target.value })} />

          <p className="mt-4 font-semibold text-black">Photo Evidence</p>

          <input
            type="file"
            accept="image/*"
            className={inputStyle}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <p className="mt-4 font-semibold text-black">Notifications & Actions</p>

          <div className="space-y-3 text-black">
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

          <button className="w-full rounded-lg bg-black p-4 text-lg font-semibold text-white">
            Submit Report
          </button>
        </form>

        {message && <p className="mt-4 text-center font-medium text-black">{message}</p>}
      </div>
    </main>
  );
}