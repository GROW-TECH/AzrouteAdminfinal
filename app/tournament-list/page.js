'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function TournamentList() {

  const [tournaments, setTournaments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    student_name: '',
    tournament_type: '',
    game: '',
    score: '',
    tournament_date: ''
  });

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchTournaments();
    fetchStudents();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('tournament_list')
      .select('*')
      .order('tournament_date', { ascending: false });

    if (!error) setTournaments(data || []);
    setLoading(false);
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('student_list')
      .select('name')
      .order('name', { ascending: true });

    setStudents(data || []);
  };

  /* ================= HANDLERS ================= */

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      student_name: '',
      tournament_type: '',
      game: '',
      score: '',
      tournament_date: ''
    });
    setShowForm(true);
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setFormData({
      student_name: row.student_name,
      tournament_type: row.tournament_type,
      game: row.game,
      score: row.score,
      tournament_date: row.tournament_date
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this tournament record?')) return;

    const { error } = await supabase
      .from('tournament_list')
      .delete()
      .eq('id', id);

    if (!error) fetchTournaments();
    else alert(error.message);
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      student_name: formData.student_name,
      tournament_type: formData.tournament_type,
      game: formData.game,
      score: Number(formData.score),
      tournament_date: formData.tournament_date
    };

    let error;

    if (editingId) {
      ({ error } = await supabase
        .from('tournament_list')
        .update(payload)
        .eq('id', editingId));
    } else {
      ({ error } = await supabase
        .from('tournament_list')
        .insert([payload]));
    }

    if (error) return alert(error.message);

    setShowForm(false);
    setEditingId(null);
    fetchTournaments();
  };

  /* ================= UI ================= */

  return (
    <div className="container my-4">

      <div className="d-flex justify-content-between mb-3">
        <h4>Tournament List</h4>
        <button className="btn btn-success" onClick={handleAdd}>
          + Add Tournament
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>

                <div className="modal-header">
                  <h5>{editingId ? 'Edit Tournament' : 'Add Tournament'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowForm(false)} />
                </div>

                <div className="modal-body">

                  {/* STUDENT DROPDOWN */}
                  <select
                    required
                    name="student_name"
                    className="form-control mb-2"
                    value={formData.student_name}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Student</option>
                    {students.map((s, i) => (
                      <option key={i} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  {/* TOURNAMENT TYPE */}
                  <select
                    required
                    name="tournament_type"
                    className="form-control mb-2"
                    value={formData.tournament_type}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Tournament Type</option>
                    <option value="Classical Tournament">Classical Tournament</option>
                    <option value="Rapid Tournament">Rapid Tournament</option>
                  </select>

                  {/* GAME */}
                  <input
                    required
                    name="game"
                    className="form-control mb-2"
                    placeholder="Game (Chess / Carrom)"
                    value={formData.game}
                    onChange={handleInputChange}
                  />

                  <input
                    required
                    type="number"
                    name="score"
                    className="form-control mb-2"
                    placeholder="Score"
                    value={formData.score}
                    onChange={handleInputChange}
                  />

                  <input
                    required
                    type="date"
                    name="tournament_date"
                    className="form-control mb-2"
                    value={formData.tournament_date}
                    onChange={handleInputChange}
                  />

                </div>

                <div className="modal-footer">
                  <button className="btn btn-primary">
                    {editingId ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table table-bordered text-center">
          <thead className="table-secondary">
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Tournament Type</th>
              <th>Game</th>
              <th>Score</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t, i) => (
              <tr key={t.id}>
                <td>{i + 1}</td>
                <td>{t.student_name}</td>
                <td>{t.tournament_type}</td>
                <td>{t.game}</td>
                <td>{t.score}</td>
                <td>{new Date(t.tournament_date).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm me-1"
                    onClick={() => handleEdit(t)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(t.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .custom-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
        }
      `}</style>

    </div>
  );
}
