'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ClassList() {

  const [classes, setClasses] = useState([]);
  const [coachOptions, setCoachOptions] = useState([]);
  const [classNameOptions, setClassNameOptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showLinks, setShowLinks] = useState(null);

  const [formData, setFormData] = useState({
    class_type: 'group',
    coach: '',
    class_name: '',
    hour: '10',
    minute: '00',
    ampm: 'AM',
    level: '',
    date: '',
    status: 'Scheduled',
    meet_link: [''],
  });

  /* ================= INIT ================= */

  useEffect(() => {
    fetchClasses();
    fetchCoachOptions();
    fetchClassNameOptions();
  }, []);

  /* ================= FETCH ================= */

  const fetchClasses = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('classlist')
      .select('*')
      .eq('created_by', session.user.id)
      .order('id', { ascending: false });

    if (!error) {
      const fixed = (data || []).map(c => ({
        ...c,
        meet_link: c.meet_link ? JSON.parse(c.meet_link) : []
      }));
      setClasses(fixed);
    }

    setLoading(false);
  };

  const fetchCoachOptions = async () => {
    const { data } = await supabase
      .from('coaches')
      .select('name, coach_display_id');
    setCoachOptions(data || []);
  };

  const fetchClassNameOptions = async () => {
    const { data } = await supabase
      .from('coaches')
      .select('specialty');
    const unique = [...new Set((data || []).map(d => d.specialty).filter(Boolean))];
    setClassNameOptions(unique);
  };

  /* ================= HELPERS ================= */

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleMeetLinkChange = (i, val) => {
    const links = [...formData.meet_link];
    links[i] = val;
    setFormData(p => ({ ...p, meet_link: links }));
  };

  const addMeetLink = () =>
    setFormData(p => ({ ...p, meet_link: [...p.meet_link, ''] }));

  const removeMeetLink = (i) =>
    setFormData(p => ({ ...p, meet_link: p.meet_link.filter((_, idx) => idx !== i) }));

  const convertTo24Hour = () => {
    let h = parseInt(formData.hour);
    if (formData.ampm === 'PM' && h !== 12) h += 12;
    if (formData.ampm === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${formData.minute}`;
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return alert('Login required');

    const coach = coachOptions.find(c => c.coach_display_id === formData.coach);

    const payload = {
      class_type: formData.class_type,
      coach: coach?.name,
      coach_id: formData.coach,
      class_name: formData.class_name,
      time: convertTo24Hour(),
      level: formData.level,
      date: formData.date,
      status: formData.status || 'Scheduled',
      meet_link: JSON.stringify(
        Array.isArray(formData.meet_link)
          ? formData.meet_link.filter(Boolean)
          : []
      ),
      created_by: session.user.id,
    };

    let query = supabase.from('classlist');

    const { error } = editingId
      ? await query.update(payload).eq('id', editingId)
      : await query.insert([payload]);

    if (error) return alert(error.message);

    setShowForm(false);
    setEditingId(null);
    fetchClasses();
  };

  /* ================= EDIT / DELETE ================= */

  const handleEdit = (c) => {
    const [h, m] = c.time.split(':');
    setEditingId(c.id);
    setFormData({
      class_type: c.class_type,
      coach: c.coach_id,
      class_name: c.class_name,
      hour: ((+h % 12) || 12).toString().padStart(2, '0'),
      minute: m,
      ampm: +h >= 12 ? 'PM' : 'AM',
      level: c.level,
      date: c.date,
      status: c.status || 'Scheduled',
      meet_link: Array.isArray(c.meet_link) ? c.meet_link : [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this class?')) return;
    await supabase.from('classlist').delete().eq('id', id);
    fetchClasses();
  };

  /* ================= UI ================= */

  return (
    <div className="container-fluid px-4 py-4">

      <div className="d-flex justify-content-between mb-3">
        <h4>Class List</h4>
        <button className="btn btn-success" onClick={() => setShowForm(true)}>
          + Add Class
        </button>
      </div>

      <table className="table table-bordered text-center">
        <thead>
          <tr>
            <th>#</th>
            <th>Coach</th>
            <th>Type</th>
            <th>Class</th>
            <th>Time</th>
            <th>Level</th>
            <th>Date</th>
            <th>Links</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c, i) => (
            <tr key={c.id}>
              <td>{i + 1}</td>
              <td>{c.coach}</td>
              <td>{c.class_type}</td>
              <td>{c.class_name}</td>
              <td>{c.time}</td>
              <td>{c.level}</td>
              <td>{c.date}</td>
              <td>
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => setShowLinks(Array.isArray(c.meet_link) ? c.meet_link : [])}
                >
                  View
                </button>
              </td>
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

      {/* MEET LINKS MODAL */}
      {showLinks && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content p-3">
              <h6>Google Meet Links</h6>
              {showLinks.map((l, i) => (
                <p key={i}>
                  <a href={l} target="_blank">{l}</a>
                </p>
              ))}
              <button className="btn btn-secondary" onClick={() => setShowLinks(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5>{editingId ? 'Edit' : 'Add'} Class</h5>
                  <button type="button" className="btn-close" onClick={() => setShowForm(false)} />
                </div>

                <div className="modal-body">

                  <select className="form-select mb-2" name="class_type" value={formData.class_type} onChange={handleInputChange}>
                    <option value="individual Offline">individual Offline</option>
                    <option value="individual Online">individual Online</option>
                    <option value="Hybrid monthly">Hybrid monthly</option>
                    <option value="Group offline">Group offline</option>
                    <option value="Yearly plan">Yearly plan</option>
                    <option value="Group online">Group online</option>
                  </select>

                  <select className="form-select mb-2" name="coach" value={formData.coach} onChange={handleInputChange}>
                    <option value="">Select Coach</option>
                    {coachOptions.map(c => (
                      <option key={c.coach_display_id} value={c.coach_display_id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select className="form-select mb-2" name="class_name" value={formData.class_name} onChange={handleInputChange}>
                    <option value="">Select Class</option>
                    {classNameOptions.map((c, i) => (
                      <option key={i}>{c}</option>
                    ))}
                  </select>

                  <input
                    type="date"
                    className="form-control mb-2"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                  />

                  {/* ✅ TIME INPUT (ADDED) */}
                  <div className="d-flex gap-2 mb-2">
                    <select className="form-select" name="hour" value={formData.hour} onChange={handleInputChange}>
                      {Array.from({ length: 12 }, (_, i) => {
                        const h = (i + 1).toString().padStart(2, '0');
                        return <option key={h} value={h}>{h}</option>;
                      })}
                    </select>

                    <select className="form-select" name="minute" value={formData.minute} onChange={handleInputChange}>
                      {['00', '15', '30', '45'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    <select className="form-select" name="ampm" value={formData.ampm} onChange={handleInputChange}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>

                  {formData.meet_link.map((l, i) => (
                    <div key={i} className="d-flex gap-2 mb-2">
                      <input
                        className="form-control"
                        value={l}
                        onChange={e => handleMeetLinkChange(i, e.target.value)}
                      />
                      {formData.meet_link.length > 1 && (
                        <button type="button" className="btn btn-danger" onClick={() => removeMeetLink(i)}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={addMeetLink}>
                    + Add link
                  </button>

                </div>

                <div className="modal-footer">
                  <button className="btn btn-primary">
                    {editingId ? 'Update' : 'Add'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
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
