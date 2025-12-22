'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function CoachList() {
  // same restricted UUID as student list
  const RESTRICTED_UUID = '415ed8d0-547d-4c84-8f82-495e59dc834a';

  const [currentUser, setCurrentUser] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    email: '',
    phone: '',
    location: ''
  });

  // NEW: file handling
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    async function init() {
      let user = null;
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user || null;
        setCurrentUser(user);
      } catch (err) {
        console.error('getUser error', err);
        setCurrentUser(null);
      } finally {
        // pass user to avoid race between setState and fetch
        await fetchCoaches(user);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch coaches; accepts optional user param to avoid race with setState
  const fetchCoaches = async (userParam = null) => {
    setLoading(true);
    try {
      const user = userParam || currentUser;

      let query = supabase.from('coaches').select('*').order('id', { ascending: true });

      // apply restriction if the current user matches RESTRICTED_UUID
      if (user && user.id === RESTRICTED_UUID) {
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.log('Fetch Error:', error);
        setCoaches([]);
      } else {
        setCoaches(data || []);
      }
    } catch (err) {
      console.error('FetchCoaches unexpected error:', err);
      setCoaches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingCoach(null);
    setFormData({ name: '', specialty: '', email: '', phone: '', location: '' });
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleEditClick = (coach) => {
    setEditingCoach(coach.id);
    setFormData({
      name: coach.name || '',
      specialty: coach.specialty || '',
      email: coach.email || '',
      phone: coach.phone || '',
      location: coach.location || ''
    });
    // keep file_url in coach object for display; if user wants to replace, choose file
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // NEW: handle file input
  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setSelectedFile(f);
  };

  // helper: upload file (returns publicUrl or null)
  async function uploadFileAndGetUrl(file) {
    if (!file) return null;
    setUploadingFile(true);
    try {
      // create a unique path
      const filePath = `coaches/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('coach-files')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return null;
      }

      // get public URL
      const { data: publicData, error: publicError } = supabase.storage
        .from('coach-files')
        .getPublicUrl(filePath);

      if (publicError) {
        console.error('Get public url error:', publicError);
        return null;
      }

      return publicData?.publicUrl || null;
    } finally {
      setUploadingFile(false);
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const { name, specialty, email, phone, location } = formData;

    // use currentUser id as created_by for inserts
    const ownerId = currentUser?.id || null;

    // If a file is selected, upload first
    let fileUrl = null;
    if (selectedFile) {
      fileUrl = await uploadFileAndGetUrl(selectedFile);
      if (!fileUrl) {
        alert('File upload failed. Please try again.');
        return;
      }
    }

    if (editingCoach !== null) {
      // Update existing coach; include file_url only when fileUrl is present
      const updates = { name, specialty, email, phone, location };
      if (fileUrl) updates.file_url = fileUrl;

      const { error } = await supabase
        .from('coaches')
        .update(updates)
        .eq('id', editingCoach);

      if (error) alert('Update error: ' + error.message);
    } else {
      // Insert new coach with created_by and file_url if present
      const insertRow = { name, specialty, email, phone, location, created_by: ownerId };
      if (fileUrl) insertRow.file_url = fileUrl;

      const { error } = await supabase
        .from('coaches')
        .insert([insertRow]);

      if (error) alert('Insert error: ' + error.message);
    }

    setShowForm(false);
    setEditingCoach(null);
    setFormData({ name: '', specialty: '', email: '', phone: '', location: '' });
    setSelectedFile(null);
    // re-fetch passing currentUser to ensure same restriction logic
    await fetchCoaches(currentUser);
  };

  const handleDeleteClick = async (id) => {
    const { error } = await supabase
      .from('coaches')
      .delete()
      .eq('id', id);

    if (error) alert('Delete error: ' + error.message);
    else await fetchCoaches(currentUser);
  };

  // helper: check if url points to an image (basic)
  function isImageUrl(url) {
    if (!url) return false;
    return /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(url.split('?')[0]);
  }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 fw-bold">Coach List</h2>
        <button onClick={handleAddClick} className="btn btn-success">+ Add Coach</button>
      </div>

      {showForm && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content shadow custom-modal-content">
              <div className="modal-header custom-modal-header">
                <h5 className="modal-title">{editingCoach ? 'Edit Coach' : 'Add Coach'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body custom-modal-body">
                  {['name','specialty','email','phone','location'].map(field => (
                    <div className="mb-3" key={field}>
                      <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                      <input
                        required
                        type={field === 'email' ? 'email' : 'text'}
                        name={field}
                        className="form-control"
                        value={formData[field]}
                        onChange={handleInputChange}
                      />
                    </div>
                  ))}

                  {/* NEW: file upload */}
                  <div className="mb-3">
                    <label className="form-label">Upload file (image/pdf/other)</label>
                    <input type="file" className="form-control" onChange={handleFileChange} />
                    {uploadingFile && <div className="small text-muted mt-1">Uploading file...</div>}
                    {editingCoach && !selectedFile && (
                      // show existing file link if editing and no new file selected
                      (() => {
                        const coach = coaches.find(c => c.id === editingCoach);
                        if (!coach || !coach.file_url) return null;
                        return (
                          <div className="mt-2">
                            <div className="small">Existing file:</div>
                            {isImageUrl(coach.file_url) ? (
                              <img src={coach.file_url} alt="coach" style={{ maxWidth: 120, display: 'block', marginTop: 6 }} />
                            ) : (
                              <a href={coach.file_url} target="_blank" rel="noreferrer">View file</a>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
                <div className="modal-footer custom-modal-footer">
                  <button type="submit" className="btn btn-primary" disabled={uploadingFile}>{editingCoach ? 'Update' : 'Add'}</button>
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
              <th>Coach ID</th>
              <th>Name</th>
              <th>Specialty</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Location</th>
              <th>File</th> {/* NEW */}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coaches.map((coach, idx) => (
              <tr key={coach.id}>
                <td>{idx + 1}</td>
                <td>{coach.coach_display_id}</td>
                <td>{coach.name}</td>
                <td>{coach.specialty}</td>
                <td>{coach.email}</td>
                <td>{coach.phone}</td>
                <td>{coach.location}</td>
                <td style={{whiteSpace: 'nowrap'}}>
                  {coach.file_url ? (
                    isImageUrl(coach.file_url) ? (
                      <a href={coach.file_url} target="_blank" rel="noreferrer"><img src={coach.file_url} alt="file" style={{maxWidth: 60, maxHeight: 60}} /></a>
                    ) : (
                      <a href={coach.file_url} target="_blank" rel="noreferrer">View</a>
                    )
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <button onClick={() => handleEditClick(coach)} className="btn btn-warning btn-sm">Edit</button>
                    <button onClick={() => handleDeleteClick(coach.id)} className="btn btn-danger btn-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
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
        img { border-radius: 4px; }
      `}</style>
    </div>
  );
}
