'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaShareAlt } from "react-icons/fa";

export default function DemoClasses() {
  const RESTRICTED_UUID = '415ed8d0-547d-4c84-8f82-495e59dc834a'; // optional admin id
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    coach: '',
    date: '',
    hour: '10',
    minute: '00',
    ampm: 'AM',
    duration: '',
    level: [],
    description: '',
    course: '',
    meet_link: ''
  });

  const [coachOptions, setCoachOptions] = useState([]);
  const [classTitleOptions, setClassTitleOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    await fetchCoachOptions();
    await fetchClassTitleOptions();
    await fetchCourseOptions();
    await fetchClasses();
  };

  // FETCH CLASSES -> only rows created_by === logged-in user (or optionally admin)
  const fetchClasses = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      setClasses([]);
      setLoading(false);
      return;
    }

    // If you want RESTRICTED_UUID to see all rows, do:
    // const query = userId === RESTRICTED_UUID ? supabase.from('demo_classes').select('*') : supabase.from('demo_classes').select('*').eq('created_by', userId)
    // For now: show only rows created by the logged-in user:
    const { data, error } = await supabase
      .from('demo_classes')
      .select('*')
      .eq('created_by', userId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Fetch Error:', error);
      setClasses([]);
    } else {
      setClasses(data || []);
    }
    setLoading(false);
  };

  const fetchCoachOptions = async () => {
    const { data, error } = await supabase
      .from('coaches')
      .select('name');

    if (!error && Array.isArray(data)) {
      const uniqueCoaches = [...new Set(data.map(c => c.name))].filter(Boolean);
      setCoachOptions(uniqueCoaches);
    }
  };

  const fetchClassTitleOptions = async () => {
    const { data, error } = await supabase
      .from('coaches')
      .select('specialty');

    if (!error && Array.isArray(data)) {
      const uniqueSpecialties = [...new Set(data.map(c => c.specialty))].filter(Boolean);
      setClassTitleOptions(uniqueSpecialties);
    }
  };

  const fetchCourseOptions = async () => {
    const { data, error } = await supabase
      .from('course')
      .select('id, title')
      .order('title', { ascending: true });

    if (!error && Array.isArray(data)) {
      setCourseOptions(data);
    } else {
      setCourseOptions([]);
      if (error) console.warn('fetchCourseOptions error', error);
    }
  };

  const handleAddClick = () => {
    setEditingClass(null);
    setFormData({
      title: '',
      coach: '',
      date: '',
      hour: '10',
      minute: '00',
      ampm: 'AM',
      duration: '',
      level: [],
      description: '',
      course: '',
      meet_link: ''
    });
    setShowForm(true);
  };

  const handleEditClick = (cls) => {
    let hour = '10', minute = '00', ampm = 'AM';
    if (cls.time) {
      const parts = cls.time.split(/[: ]/);
      if (parts.length === 3) {
        [hour, minute, ampm] = parts;
      }
    }

    let levelArray = [];
    if (Array.isArray(cls.level)) levelArray = cls.level;
    else if (typeof cls.level === 'string' && cls.level.trim() !== '') {
      levelArray = cls.level.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      levelArray = [];
    }

    setEditingClass(cls.id);
    setFormData({
      title: cls.title ?? '',
      coach: cls.coach ?? '',
      date: cls.date ?? '',
      hour,
      minute,
      ampm,
      duration: cls.duration ?? '',
      level: levelArray,
      description: cls.description ?? '',
      course: cls.course ?? '',
      meet_link: cls.meet_link ?? ''
    });
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, multiple, options } = e.target;
    if (name === 'level' && multiple && options) {
      const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
      setFormData(prev => ({ ...prev, [name]: selected }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;
    if (!userId) {
      alert('You must be logged in to add/edit demo classes.');
      return;
    }

    const time = `${formData.hour}:${formData.minute} ${formData.ampm}`;
    const levelForDb = Array.isArray(formData.level) ? formData.level.join(',') : (formData.level || '');

    const dbData = {
      title: formData.title,
      coach: formData.coach,
      date: formData.date || null,
      time,
      duration: formData.duration,
      level: levelForDb,
      description: formData.description,
      course: formData.course,
      meet_link: formData.meet_link,
      created_by: userId // <-- store creator
    };

    try {
      if (editingClass !== null) {
        // restrict update to rows owned by the user
        const { error } = await supabase
          .from('demo_classes')
          .update(dbData)
          .eq('id', editingClass)
          .eq('created_by', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('demo_classes')
          .insert([dbData]);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingClass(null);
      setFormData({
        title: '',
        coach: '',
        date: '',
        hour: '10',
        minute: '00',
        ampm: 'AM',
        duration: '',
        level: [],
        description: '',
        course: '',
        meet_link: ''
      });
      fetchClasses();
    } catch (err) {
      console.error('Save error:', err);
      alert('Save error: ' + (err?.message ?? 'Unknown error'));
    }
  };

  const handleDeleteClick = async (id) => {
    if (!confirm('Delete this demo class?')) return;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;
    if (!userId) {
      alert('Not authorized.');
      return;
    }

    // restrict delete to rows that belong to the user
    const { error } = await supabase
      .from('demo_classes')
      .delete()
      .eq('id', id)
      .eq('created_by', userId);

    if (error) {
      alert('Delete error: ' + error.message);
    } else {
      fetchClasses();
    }
  };

  // ... rest of helpers and UI unchanged (formatDate, displayLevel, resolveCourseTitle, shareMeetLink)

  const resolveCourseTitle = (courseValue) => {
    if (!courseValue) return '—';
    const found = courseOptions.find(c => c.id === courseValue);
    if (found) return found.title;
    return courseValue;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString();
    } catch {
      return d;
    }
  };

  const displayLevel = (lvl) => {
    if (!lvl) return '—';
    if (Array.isArray(lvl)) return lvl.join(', ');
    if (typeof lvl === 'string') {
      const arr = lvl.split(',').map(s => s.trim()).filter(Boolean);
      return arr.length ? arr.join(', ') : '—';
    }
    return String(lvl);
  };

  const shareMeetLink = async (link) => {
    if (!link) {
      alert('No meet link available.');
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Join demo class', url: link, text: 'Join this demo class:' });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        alert('Meet link copied to clipboard.');
      } else {
        const tmp = document.createElement('input');
        tmp.value = link;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
        alert('Meet link copied to clipboard.');
      }
    } catch (err) {
      console.error('Share error', err);
      alert('Unable to share or copy the link.');
    }
  };



  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 fw-bold">Demo Classes</h2>
        <button onClick={handleAddClick} className="btn btn-success">+ Add Demo Class</button>
      </div>

      {showForm && (
        <div className="modal fade show d-block custom-modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-content shadow custom-modal-content">
              <div className="modal-header custom-modal-header">
                <h5 className="modal-title">{editingClass !== null ? 'Edit Demo Class' : 'Add Demo Class'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body custom-modal-body">
                  <div className="mb-3">
                    <label className="form-label">Class Title</label>
                    <select required className="form-select" name="title" value={formData.title} onChange={handleInputChange}>
                      <option value="">Select Class Title</option>
                      {classTitleOptions.map((title, idx) => (
                        <option key={idx} value={title}>{title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Coach Name</label>
                    <select required className="form-select" name="coach" value={formData.coach} onChange={handleInputChange}>
                      <option value="">Select Coach</option>
                      {coachOptions.map((coach, idx) => (
                        <option key={idx} value={coach}>{coach}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input required type="date" name="date" className="form-control" value={formData.date} onChange={handleInputChange} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Duration</label>
                    <input required type="text" name="duration" placeholder="e.g. 1 hr" className="form-control" value={formData.duration} onChange={handleInputChange} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea required name="description" rows={3} className="form-control" value={formData.description} onChange={handleInputChange} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Course</label>
                    <select required name="course" className="form-select" value={formData.course} onChange={handleInputChange}>
                      <option value="">Select Course</option>
                      {courseOptions.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Google Meet Link (optional)</label>
                    <input type="url" name="meet_link" className="form-control" placeholder="https://meet.google.com/xxx-xxxx-xxx" value={formData.meet_link} onChange={handleInputChange} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Time</label>
                    <div className="d-flex gap-2">
                      <select name="hour" required className="form-select" value={formData.hour} onChange={handleInputChange}>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={(i + 1 < 10 ? '0' : '') + (i + 1)}>
                            {(i + 1 < 10 ? '0' : '') + (i + 1)}
                          </option>
                        ))}
                      </select>
                      <select name="minute" required className="form-select" value={formData.minute} onChange={handleInputChange}>
                        {Array.from({ length: 60 }, (_, i) => (
                          <option key={i} value={(i < 10 ? '0' : '') + i}>
                            {(i < 10 ? '0' : '') + i}
                          </option>
                        ))}
                      </select>
                      <select name="ampm" required className="form-select" value={formData.ampm} onChange={handleInputChange}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Level</label>
                    <select
                      name="level"
                      required
                      className="form-select"
                      multiple
                      value={formData.level}
                      onChange={handleInputChange}
                      size={3}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    <div className="form-text">Hold Ctrl (Windows) / Cmd (Mac) to select multiple.</div>
                  </div>
                </div>
                <div className="modal-footer custom-modal-footer">
                  <button type="submit" className="btn btn-primary">{editingClass !== null ? 'Update' : 'Add'}</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table table-bordered table-striped">
          <thead className="table-secondary">
            <tr>
              <th>S.No</th>
              <th>Title</th>
              <th>Coach</th>
              <th>Date</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Level</th>
              <th>Course</th>
              <th>Meet Link</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.length > 0 &&
              classes.map((cls, idx) => {
                return (
                  <tr key={cls.id}>
                    <td>{idx + 1}</td>
                    <td>{cls.title}</td>
                    <td>{cls.coach}</td>
                    <td>{formatDate(cls.date)}</td>
                    <td>{cls.time}</td>
                    <td>{cls.duration}</td>
                    <td>{displayLevel(cls.level)}</td>
                    <td>{resolveCourseTitle(cls.course)}</td>
                    <td style={{ maxWidth: 220 }}>
                      {cls.meet_link ? (
                        <div className="d-flex align-items-center gap-2">
                          <a href={cls.meet_link} target="_blank" rel="noopener noreferrer" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: 120 }}>
                            {cls.meet_link}
                          </a>
                          <button
  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
  onClick={() => shareMeetLink(cls.meet_link)}
  title="Share / Copy link"
>
  <FaShareAlt size={14} />
  Share
</button>

                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td style={{ maxWidth: 300 }}>{cls.description}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button onClick={() => handleEditClick(cls)} className="btn btn-warning btn-sm">Edit</button>
                        <button onClick={() => handleDeleteClick(cls.id)} className="btn btn-danger btn-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      )}

      <style jsx>{`
        .custom-modal-overlay {
          background: rgba(0,0,0,0.4);
          position: fixed !important;
          top: 0; left: 0; width: 100vw; height: 100vh;
          display: flex; justify-content: center; align-items: center;
          z-index: 1050;
        }
        .custom-modal-content {
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        .custom-modal-header, .custom-modal-footer {
          flex-shrink: 0;
          position: sticky;
          background: #fff;
          z-index: 1;
        }
        .custom-modal-header { top: 0; }
        .custom-modal-footer { bottom: 0; }
        .custom-modal-body { overflow-y: auto; max-height: 70vh; }
      `}</style>
    </div>
  );
}
