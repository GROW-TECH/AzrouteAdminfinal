'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function OfflineClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    coach: '',
    date: '',
    hour: '10',
    minute: '00',
    ampm: 'AM',
    duration: ''
  });

  const [coachOptions, setCoachOptions] = useState([]);

  useEffect(() => {
    fetchCoachOptions();
    fetchClasses();
  }, []);

  /* ================= FETCH ================= */

  const fetchClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('offline_class')
      .select('*')
      .order('date', { ascending: true });

    if (!error) setClasses(data || []);
    setLoading(false);
  };

  const fetchCoachOptions = async () => {
    const { data } = await supabase
      .from('coaches')
      .select('name');

    if (Array.isArray(data)) {
      setCoachOptions([...new Set(data.map(c => c.name))]);
    }
  };

  /* ================= HANDLERS ================= */

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      coach: '',
      date: '',
      hour: '10',
      minute: '00',
      ampm: 'AM',
      duration: ''
    });
    setShowForm(true);
  };

  const handleEdit = (cls) => {
    const [hour, minute, ampm] = cls.time.split(/[: ]/);
    setEditingId(cls.id);
    setFormData({
      coach: cls.coach,
      date: cls.date,
      hour,
      minute,
      ampm,
      duration: cls.duration
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this offline class?')) return;

    const { error } = await supabase
      .from('offline_class')
      .delete()
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchClasses();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      coach: formData.coach,
      date: formData.date,
      time: `${formData.hour}:${formData.minute} ${formData.ampm}`,
      duration: formData.duration
    };

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from('offline_class')
        .update(payload)
        .eq('id', editingId));
    } else {
      ({ error } = await supabase
        .from('offline_class')
        .insert([payload]));
    }

    if (error) {
      alert(error.message);
      return;
    }

    setShowForm(false);
    setEditingId(null);
    fetchClasses();
  };

  /* ================= UI ================= */

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between mb-3">
        <h4>Offline Classes</h4>
        <button className="btn btn-success" onClick={handleAdd}>
          + Add Offline Class
        </button>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5>{editingId ? 'Edit' : 'Add'} Offline Class</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowForm(false)}
                  />
                </div>

                <div className="modal-body">
                  <select
                    required
                    name="coach"
                    className="form-select mb-2"
                    value={formData.coach}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Coach</option>
                    {coachOptions.map((c, i) => (
                      <option key={i}>{c}</option>
                    ))}
                  </select>

                  <input
                    required
                    type="date"
                    name="date"
                    className="form-control mb-2"
                    value={formData.date}
                    onChange={handleInputChange}
                  />

                  <div className="d-flex gap-2 mb-2">
                    <select name="hour" className="form-select" value={formData.hour} onChange={handleInputChange}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i}>{String(i + 1).padStart(2, '0')}</option>
                      ))}
                    </select>

                    <select name="minute" className="form-select" value={formData.minute} onChange={handleInputChange}>
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i}>{String(i).padStart(2, '0')}</option>
                      ))}
                    </select>

                    <select name="ampm" className="form-select" value={formData.ampm} onChange={handleInputChange}>
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>

                  <input
                    required
                    name="duration"
                    placeholder="Duration (eg: 1 Hour)"
                    className="form-control"
                    value={formData.duration}
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
          <thead>
            <tr>
              <th>#</th>
              <th>Coach</th>
              <th>Date</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c, i) => (
              <tr key={c.id}>
                <td>{i + 1}</td>
                <td>{c.coach}</td>
                <td>{c.date}</td>
                <td>{c.time}</td>
                <td>{c.duration}</td>
                <td>
                  <button className="btn btn-warning btn-sm me-1" onClick={() => handleEdit(c)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>
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
