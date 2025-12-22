'use client';

import { useState, useEffect, useRef } from 'react';
import { Table, Button, Form, Row, Col, InputGroup, FormControl } from 'react-bootstrap';
import { supabase } from '../../lib/supabaseClient';

export default function CoursePage() {   // ✅ Renamed
  // Change this to the UUID you want to restrict to
  const RESTRICTED_UUID = '415ed8d0-547d-4c84-8f82-495e59dc834a';

  const [currentUser, setCurrentUser] = useState(null);
  const [course, setcourse] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState('add');
  const fileRef = useRef(null);
  const BUCKET = 'course_pdfs';

  const [form, setForm] = useState({
    id: null,
    title: '',
    level: '',
    pdf_path: '',
    coach_name: '',
    stage: '',
    pgn_link: '',
    coach_self_study: false,
    student_self_study: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);

  const [coaches, setCoaches] = useState([]);
  const [stages, setStages] = useState([]);

  // load user first, then load coaches + courses + stages
  useEffect(() => {
    async function init() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;
        setCurrentUser(user);
      } catch (err) {
        console.error('getUser error', err);
        setCurrentUser(null);
      }
    }
    init();
  }, []);

  // when currentUser changes (including initial null -> user), fetch data
  useEffect(() => {
    fetchCoaches();
    fetchcourse();
    fetchStagesFromStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  async function fetchcourse() {
    try {
      let q = supabase
        .from('course')
        .select('id, title, level, pdf_path, coach_name, created_at, created_by, stage, pgn_link, coach_self_study, student_self_study')
        .order('created_at', { ascending: false });

      if (currentUser && currentUser.id === RESTRICTED_UUID) {
        q = q.eq('created_by', currentUser.id);
      }

      const { data, error } = await q;
      if (error) {
        console.error('fetchcourse', error);
        setcourse([]);
        setFiltered([]);
        return;
      }
      const mapped = (data || []).map((c) => ({
        ...c,
        coach_name: c.coach_name ?? '',
        stage: c.stage ?? '',
        pgn_link: c.pgn_link ?? '',
        coach_self_study: !!c.coach_self_study,
        student_self_study: !!c.student_self_study,
      }));
      setcourse(mapped);
      setFiltered(mapped);
    } catch (err) {
      console.error('fetchcourse unexpected', err);
      setcourse([]);
      setFiltered([]);
    }
  }

  async function fetchCoaches() {
    try {
      const { data, error } = await supabase.from('coaches').select('id, name').order('name', { ascending: true });
      if (error) {
        console.error('fetchCoaches', error);
        setCoaches([]);
        return;
      }
      setCoaches((data || []).map(c => ({ id: c.id, name: c.name })));
    } catch (err) {
      console.error('fetchCoaches unexpected', err);
      setCoaches([]);
    }
  }

  // fetch distinct stage1 values from student_list
  async function fetchStagesFromStudents() {
    try {
      const { data, error } = await supabase.from('student_list').select('stage1').order('stage1', { ascending: true });
      if (error) {
        console.error('fetchStagesFromStudents', error);
        setStages([]);
        return;
      }
      const unique = Array.from(new Set((data || []).map(r => (r.stage1 || '').trim()).filter(Boolean)));
      setStages(unique);
    } catch (err) {
      console.error('fetchStagesFromStudents unexpected', err);
      setStages([]);
    }
  }

  function openAdd() {
    setMode('add');
    setForm({
      id: null,
      title: '',
      level: '',
      pdf_path: '',
      coach_name: '',
      stage: '',
      pgn_link: '',
      coach_self_study: false,
      student_self_study: false,
    });
    if (fileRef.current) fileRef.current.value = '';
    setShowForm(true);
  }

  function openEdit(row) {
    setMode('edit');
    setForm({
      id: row.id,
      title: row.title || '',
      level: row.level || '',
      pdf_path: row.pdf_path || '',
      coach_name: row.coach_name ?? '',
      stage: row.stage || '',
      pgn_link: row.pgn_link || '',
      coach_self_study: !!row.coach_self_study,
      student_self_study: !!row.student_self_study,
    });
    if (fileRef.current) fileRef.current.value = '';
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm({
      id: null,
      title: '',
      level: '',
      pdf_path: '',
      coach_name: '',
      stage: '',
      pgn_link: '',
      coach_self_study: false,
      student_self_study: false,
    });
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm(p => ({ ...p, [name]: checked }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  }

  async function uploadFile(file) {
    if (!file) return null;
    try {
      setUploading(true);
      const unique = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from(BUCKET).upload(unique, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      return { path: data.path };
    } catch (err) {
      console.error('uploadFile', err);
      alert('Upload failed: ' + (err.message || err));
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function getFileUrl(storedPath) {
    if (!storedPath) return null;
    try {
      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storedPath);
      if (publicData?.publicUrl) {
        try {
          const resp = await fetch(publicData.publicUrl, { method: 'HEAD' });
          if (resp.ok) return publicData.publicUrl;
        } catch {}
      }
      const { data: signedData } = await supabase.storage.from(BUCKET).createSignedUrl(storedPath, 3600);
      return signedData?.signedUrl ?? null;
    } catch (err) {
      console.error('getFileUrl', err);
      return null;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title?.trim()) return alert('Title required');
    if (!form.coach_name?.trim()) return alert('Please select a coach.');

    const file = fileRef.current?.files?.[0];
    let uploadResult = null;
    if (file) {
      uploadResult = await uploadFile(file);
      if (!uploadResult) return;
    }

    const payload = {
      title: form.title,
      level: form.level || null,
      pdf_path: uploadResult ? uploadResult.path : form.pdf_path || null,
      coach_name: form.coach_name,
      updated_at: new Date().toISOString(),
      stage: form.stage || null,
      pgn_link: form.pgn_link?.trim() || null,
      coach_self_study: !!form.coach_self_study,
      student_self_study: !!form.student_self_study,
    };

    if (mode === 'add') {
      const { data, error } = await supabase.from('course').insert([{
        ...payload,
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || null,
      }]).select('id, title, level, pdf_path, coach_name, created_at, created_by, stage, pgn_link, coach_self_study, student_self_study').maybeSingle();

      if (error) {
        console.error('Insert error', error);
        alert('Insert failed: ' + (error.message || JSON.stringify(error)));
      } else {
        await fetchcourse();
        closeForm();
      }
    } else {
      const { error } = await supabase.from('course').update(payload).eq('id', form.id);
      if (error) {
        console.error('Update error', error);
        alert('Update failed: ' + (error.message || JSON.stringify(error)));
      } else {
        await fetchcourse();
        closeForm();
      }
    }
  }

  async function deleteCourse(id) {
    if (!confirm('Are you sure to delete this course?')) return;
    const { error } = await supabase.from('course').delete().eq('id', id);
    if (error) {
      alert('Delete failed: ' + error.message);
    } else {
      await fetchcourse();
    }
  }

  function handleSearchInput(e) {
    setSearchTerm(e.target.value);
  }

  function handleSearch() {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFiltered(course);
      return;
    }
    const res = course.filter((c) =>
      (c.title || '').toLowerCase().includes(term) ||
      (c.level || '').toLowerCase().includes(term) ||
      (c.coach_name || '').toLowerCase().includes(term) ||
      (c.stage || '').toLowerCase().includes(term)
    );
    setFiltered(res);
  }

  const handleViewPDF = async (pdfPath) => {
    if (!pdfPath) return alert('No PDF file available');
    try {
      const url = await getFileUrl(pdfPath);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else alert('PDF not accessible');
    } catch (err) {
      console.error('view pdf', err);
      alert('Error opening PDF');
    }
  };

  useEffect(() => {
    setFiltered(course);
  }, [course]);

  // open PGN link in new tab (validates basic http/https)
  function openPgn(pgn) {
    if (!pgn) return alert('No PGN link provided');
    const url = pgn.trim();
    const ok = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    window.open(ok, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="page-wrap">
      <div className="container mt-4 content-card">
        <div className="d-flex align-items-center mb-3">
          <h2 className="me-auto page-title">Learning Repository</h2>
        </div>

        <Row className="align-items-center mb-3 gx-3">
          <Col md={7}>
            <InputGroup className="search-input">
              <FormControl
                placeholder="Search by title, level, coach or stage"
                value={searchTerm}
                onChange={handleSearchInput}
                style={{ borderRadius: '6px', height: '42px' }}
              />
              <Button className="btn-search" onClick={handleSearch} style={{ minWidth: '95px', borderRadius: '6px' }}>
                Search
              </Button>
            </InputGroup>
          </Col>
          <Col md={5} className="text-end">
            <Button className="btn-add" onClick={openAdd}>+ Add Course</Button>
          </Col>
        </Row>

        {showForm && (
          <div className="modal fade show d-block custom-modal-overlay">
            <div className="modal-dialog modal-lg">
              <div className="modal-content shadow custom-modal-content">
                <div className="modal-header custom-modal-header">
                  <h5 className="modal-title">{mode === 'add' ? 'Add Course' : 'Edit Course'}</h5>
                  <button type="button" className="btn-close" onClick={closeForm}></button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body custom-modal-body">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Course Name</Form.Label>
                          <Form.Control name="title" value={form.title} onChange={handleChange} required />
                        </Form.Group>
                      </Col>

                      <Col md={3}>
                        <Form.Group className="mb-2">
                          <Form.Label>Level</Form.Label>
                          <Form.Select name="level" value={form.level} onChange={handleChange}>
                            <option value="">Select</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={3}>
                        <Form.Group className="mb-2">
                          <Form.Label>Coach</Form.Label>
                          <Form.Select name="coach_name" value={form.coach_name ?? ''} onChange={handleChange} required>
                            <option value="">Select Coach</option>
                            {coaches.map((c) => <option key={String(c.id)} value={c.name}>{c.name}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      {/* <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label>Stage (from students)</Form.Label>
                          <Form.Select name="stage" value={form.stage ?? ''} onChange={handleChange}>
                            <option value="">Select Stage</option>
                            {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col> */}

                      <Col md={8}>
                        <Form.Group className="mb-2">
                          <Form.Label>PGN Link</Form.Label>
                          <Form.Control name="pgn_link" value={form.pgn_link} onChange={handleChange} placeholder="https://example.com/game.pgn or paste link" />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group className="mb-2">
                          <Form.Label>Course PDF</Form.Label>
                          <Form.Control ref={fileRef} type="file" accept="application/pdf" />
                          {form.pdf_path && !fileRef.current?.files?.length && (
                            <div className="mt-2 existing-file">
                              Existing file:{' '}
                              <a href="#" onClick={(e) => { e.preventDefault(); handleViewPDF(form.pdf_path); }}>View PDF</a>
                            </div>
                          )}
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Check
                            name="coach_self_study"
                            checked={!!form.coach_self_study}
                            onChange={handleChange}
                            label="Coach Self study"
                            type="checkbox"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Check
                            name="student_self_study"
                            checked={!!form.student_self_study}
                            onChange={handleChange}
                            label="Student Self study"
                            type="checkbox"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <div className="modal-footer custom-modal-footer">
                    <button type="submit" className="btn btn-primary" disabled={uploading}>
                      {uploading ? 'Uploading...' : (mode === 'add' ? 'Save' : 'Update')}
                    </button>
                    <button type="button" onClick={closeForm} className="btn btn-secondary">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <Table bordered hover responsive className="course-table">
          <thead>
            <tr>
              <th style={{ width: '240px' }}>Course Name</th>
              <th style={{ width: '160px' }}>Level</th>
              <th style={{ width: '160px' }}>Coach</th>
              <th style={{ width: '160px' }}>PGN Link</th>
              <th style={{ width: '120px' }}>Self Study (Coach)</th>
              <th style={{ width: '120px' }}>Self Study (Student)</th>
              <th style={{ width: '140px' }}>PDF</th>
              <th style={{ width: '140px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="9" className="text-center">No course found.</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: 'normal' }}>{c.title}</td>
                  <td style={{ whiteSpace: 'normal' }}>{c.level}</td>
                  <td style={{ whiteSpace: 'normal' }}>{c.coach_name || '—'}</td>
                  <td style={{ whiteSpace: 'normal' }}>
                    {c.pgn_link ? (
                      <a href="#" onClick={(e) => { e.preventDefault(); openPgn(c.pgn_link); }}>{c.pgn_link}</a>
                    ) : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>{c.coach_self_study ? '✔' : '—'}</td>
                  <td style={{ textAlign: 'center' }}>{c.student_self_study ? '✔' : '—'}</td>
                  <td style={{ whiteSpace: 'normal' }}>
                    {c.pdf_path ? (
                      <a href="#" onClick={(e) => { e.preventDefault(); handleViewPDF(c.pdf_path); }} className="view-pdf-link">View PDF</a>
                    ) : 'No PDF'}
                  </td>
                  <td style={{ whiteSpace: 'normal' }}>
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'row' }}>
                      <Button className="btn-edit" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                      <Button className="btn-delete" size="sm" onClick={() => deleteCourse(c.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <style jsx>{`
        .page-wrap { min-height: calc(100vh - 20px); background: #f3f6f9; padding: 12px 18px; }
        .content-card { background: #fff; border-radius: 6px; padding: 22px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
        .page-title { margin: 0; font-weight: 600; color: #1f2d3d; }
        .search-input .form-control { border-right: none; box-shadow: none; }
        .search-input .btn-search { background: linear-gradient(90deg,#6f42ff,#8b5cf6); border: none; color: #fff; box-shadow: none; }
        .btn-add { background: #28a745; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; }
        .course-table thead th { background: #fafbfd; border-bottom: 1px solid #e6e9ee; font-weight: 600; color: #4b5563; }
        .view-pdf-link { text-decoration: underline; cursor: pointer; color: #6f42ff; }
        .existing-file a { color: #6f42ff; text-decoration: underline; }
        .btn-edit { background: #ffb000; border: none; color: #fff; }
        .btn-delete { background: #e53e3e; border: none; color: #fff; }
        .custom-modal-overlay { background: rgba(0,0,0,0.35); position: fixed !important; top: 0; left: 0; width: 100vw; height: 100vh; display:flex; justify-content:center; align-items:center; z-index:1050; }
        .custom-modal-content { max-height: 90vh; display: flex; flex-direction: column; border-radius: 8px; }
        .custom-modal-header, .custom-modal-footer { flex-shrink:0; position: sticky; background: #fff; z-index:1; padding:1rem; }
        .custom-modal-header { top:0; border-bottom:1px solid #e9ecef; }
        .custom-modal-footer { bottom:0; border-top:1px solid #e9ecef; display:flex; justify-content:flex-end; gap:0.5rem; padding:0.75rem 1rem; }
        .custom-modal-body { overflow-y: auto; max-height: 70vh; padding: 1rem; }
        table thead th, table tbody td { vertical-align: middle; }
        @media (max-width: 767px) { .search-input { margin-bottom: 12px; } .btn-add { width:100%; } }
      `}</style>
    </div>
  );
}
