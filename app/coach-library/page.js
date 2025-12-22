"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function CoachLibrary() {
  const [coaches, setCoaches] = useState([]);
  const [rows, setRows] = useState([]);
  const [coachId, setCoachId] = useState("");
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadCoaches();
    loadLibrary();
  }, []);

  const loadCoaches = async () => {
    const { data } = await supabase.from("coaches").select("id,name");
    setCoaches(data || []);
  };

  const loadLibrary = async () => {
    const { data } = await supabase
      .from("coach_library")
      .select("id,file_url,coaches(name)")
      .order("created_at", { ascending: false });

    setRows(data || []);
  };

  const uploadFile = async () => {
    if (!coachId || !file) return alert("Coach & file required");

    const path = `coach-library/${Date.now()}_${file.name}`;
    await supabase.storage.from("coach-library").upload(path, file);

    const { data } = supabase.storage
      .from("coach-library")
      .getPublicUrl(path);

    if (editingId) {
      await supabase
        .from("coach_library")
        .update({ file_url: data.publicUrl, coach_id: coachId })
        .eq("id", editingId);
    } else {
      await supabase.from("coach_library").insert({
        coach_id: coachId,
        file_url: data.publicUrl
      });
    }

    resetForm();
    loadLibrary();
  };

  const deleteRow = async (id) => {
    if (!confirm("Delete this file?")) return;
    await supabase.from("coach_library").delete().eq("id", id);
    loadLibrary();
  };

  const editRow = (row) => {
    setEditingId(row.id);
    setCoachId(
      coaches.find(c => c.name === row.coaches?.name)?.id || ""
    );
  };

  const resetForm = () => {
    setCoachId("");
    setFile(null);
    setEditingId(null);
  };

  const filteredRows = rows.filter(r =>
    r.coaches?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4">
      <h4 className="mb-3 fw-bold">Coach Library</h4>

      <div className="row mb-3">
        <div className="col-md-4">
          <select
            className="form-control"
            value={coachId}
            onChange={e => setCoachId(e.target.value)}
          >
            <option value="">Select Coach</option>
            {coaches.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <input
            type="file"
            className="form-control"
            onChange={e => setFile(e.target.files[0])}
          />
        </div>

        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={uploadFile}>
            {editingId ? "Update" : "Upload"}
          </button>
        </div>

        {editingId && (
          <div className="col-md-2">
            <button className="btn btn-secondary w-100" onClick={resetForm}>
              Cancel
            </button>
          </div>
        )}
      </div>

      <input
        className="form-control mb-3"
        placeholder="Search by coach name"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <table className="table table-bordered table-striped">
        <thead className="table-secondary">
          <tr>
            <th>#</th>
            <th>Coach</th>
            <th>File</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center">No records</td>
            </tr>
          )}

          {filteredRows.map((r, i) => (
            <tr key={r.id}>
              <td>{i + 1}</td>
              <td>{r.coaches?.name}</td>
              <td>
                <a href={r.file_url} target="_blank">View</a>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-warning me-2"
                  onClick={() => editRow(r)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteRow(r.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
