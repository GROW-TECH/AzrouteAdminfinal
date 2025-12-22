'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Table, Button, Form, Row, Col, Card } from 'react-bootstrap';

function generateRegNo() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export default function CourseStudentsPage() {
  // same restricted uuid logic as your other pages
  const RESTRICTED_UUID = '415ed8d0-547d-4c84-8f82-495e59dc834a';

  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [filteredStudents, setFilteredStudents] = useState([]);

  // Add / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null); // null => adding, id => editing

  const [form, setForm] = useState({
    reg_no: generateRegNo(),
    name: '',
    dob: '',
    email: '',
    phone: '',
    place: '',
    class_type: '',
    group_name: '',
    course: '',
    level: '',
    stage1: '',
    batch_time: '',
    payment: '',
    status: 'Pending',
    fees: '',
    enquiry_from: '',
  });

  useEffect(() => {
    async function init() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user || null;
        setCurrentUser(user);
        await loadStudents(user);
      } catch (err) {
        console.error('Auth / load students error:', err);
        await loadStudents(null);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStudents(user) {
    try {
      let query = supabase.from('student_list').select('*').order('id', { ascending: true });

      if (user && user.id === RESTRICTED_UUID) {
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Fetch students error:', error);
        setStudents([]);
        setCourses([]);
        setFilteredStudents([]);
        return;
      }

      const rows = data || [];
      setStudents(rows);

      // build course list from rows (existing behaviour)
      const courseNames = Array.from(new Set(rows.map((s) => s.course).filter(Boolean)));
      setCourses(['all', ...courseNames]);

      if (selectedCourse && selectedCourse !== 'all') {
        setFilteredStudents(rows.filter((s) => s.course === selectedCourse));
      } else {
        setFilteredStudents(rows);
      }
    } catch (err) {
      console.error('Unexpected loadStudents error:', err);
      setStudents([]);
      setCourses([]);
      setFilteredStudents([]);
    }
  }

  useEffect(() => {
    if (selectedCourse && selectedCourse !== 'all') {
      setFilteredStudents(students.filter((s) => s.course === selectedCourse));
    } else {
      setFilteredStudents(students);
    }
  }, [selectedCourse, students]);

  const totalStudents = filteredStudents.length;
  const registered = filteredStudents.filter(s => s.course).length;
  const unregistered = students.filter((student) => !student.course).length;

  // open add modal
  function openAddModal() {
    setEditingId(null);
    setForm({
      reg_no: generateRegNo(),
      name: '',
      dob: '',
      email: '',
      phone: '',
      place: '',
      class_type: '',
      group_name: '',
      course: '',
      level: '',
      stage1: '',
      batch_time: '',
      payment: '',
      status: 'Pending',
      fees: '',
      enquiry_from: '',
    });
    setShowModal(true);
  }

  // open edit modal
  function openEditModal(student) {
    setEditingId(student.id);
    setForm({
      reg_no: student.reg_no || generateRegNo(),
      name: student.name || '',
      dob: student.dob || '',
      email: student.email || '',
      phone: student.phone || '',
      place: student.place || '',
      class_type: student.class_type || '',
      group_name: student.group_name || '',
      course: student.course || '',
      level: student.level || '',
      stage1: student.stage1 || '',
      batch_time: student.batch_time || '',
      payment: student.payment || '',
      status: student.status || 'Pending',
      fees: student.fees !== null && student.fees !== undefined ? String(student.fees) : '',
      enquiry_from: student.enquiry_from || '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const ownerId = currentUser?.id || null;
      const payload = {
        reg_no: form.reg_no || generateRegNo(),
        name: form.name,
        dob: form.dob || null,
        email: form.email || null,
        phone: form.phone || null,
        place: form.place || null,
        class_type: form.class_type || null,
        group_name: form.group_name || null,
        course: form.course || null,
        level: form.level || null,
        stage1: form.stage1 || null,
        batch_time: form.batch_time || null,
        payment: form.payment || null,
        status: form.status || 'Pending',
        fees: form.fees === '' || form.fees == null ? null : parseFloat(form.fees),
        enquiry_from: form.enquiry_from || null,
        created_by: ownerId,
      };

      if (editingId) {
        // update
        const { error } = await supabase.from('student_list').update(payload).eq('id', editingId);
        if (error) {
          console.error('Update error:', error);
          alert('Update failed: ' + error.message);
        } else {
          await loadStudents(currentUser);
          closeModal();
        }
      } else {
        // insert
        const { error } = await supabase.from('student_list').insert([payload]).select('id, reg_no');
        if (error) {
          console.error('Insert error:', error);
          alert('Insert failed: ' + error.message);
        } else {
          await loadStudents(currentUser);
          closeModal();
        }
      }
    } catch (err) {
      console.error('Submit unexpected error:', err);
      alert('Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  // delete student
  async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      const { error } = await supabase.from('student_list').delete().eq('id', id);
      if (error) {
        console.error('Delete error:', error);
        alert('Delete failed: ' + error.message);
      } else {
        await loadStudents(currentUser);
      }
    } catch (err) {
      console.error('Delete unexpected error:', err);
      alert('Unexpected error during delete');
    }
  }

  return (
    <div className="container mt-4">
      <h2>Course Registered Student List</h2>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Students</Card.Title>
              <Card.Text>{totalStudents}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center bg-success text-white">
            <Card.Body>
              <Card.Title>Registered</Card.Title>
              <Card.Text>{registered}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        {selectedCourse === 'all' && (
          <Col md={4}>
            <Card className="text-center bg-danger text-white">
              <Card.Body>
                <Card.Title>Unregistered</Card.Title>
                <Card.Text>{unregistered}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      <Row className="align-items-center mb-3">
        <Col md={8}>
          <Form.Group>
            <Form.Label>Select Course</Form.Label>
            <Form.Select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course === 'all' ? 'All' : course}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4} className="text-end">
          <Button variant="success" onClick={openAddModal}>+ Add Register</Button>
        </Col>
      </Row>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>S.No</th>
            <th>RegNo</th>
            <th>Student Name</th>
            <th>Course</th>
            <th>Level</th>
            <th>Stage</th>
            <th>Batch Time</th>
            <th>Class Type</th>
            <th>Enquiry From</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length === 0 ? (
            <tr>
              <td colSpan="10" className="text-center">No students found.</td>
            </tr>
          ) : (
            filteredStudents.map((student, idx) => (
              <tr key={student.id}>
                <td>{idx + 1}</td>
                <td>{student.reg_no}</td>
                <td>{student.name}</td>
                <td>{student.course}</td>
                <td>{student.level}</td>
                <td>{student.stage1 || ''}</td>
                <td>{student.batch_time || ''}</td>
                <td>{student.class_type || ''}</td>
                <td>{student.enquiry_from || ''}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="sm" variant="warning" onClick={() => openEditModal(student)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => deleteStudent(student.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Modal (Bootstrap-like look used elsewhere) */}
      {showModal && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog modal-lg">
            <div className="modal-content shadow custom-modal-content">
              <div className="modal-header custom-modal-header">
                <h5 className="modal-title">{editingId ? 'Edit Register' : 'Add Register'}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body custom-modal-body">
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Reg No</Form.Label>
                        <Form.Control name="reg_no" value={form.reg_no} onChange={handleInputChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group className="mb-2">
                        <Form.Label>Name</Form.Label>
                        <Form.Control name="name" value={form.name} onChange={handleInputChange} required />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>DOB</Form.Label>
                        <Form.Control type="date" name="dob" value={form.dob} onChange={handleInputChange} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" name="email" value={form.email} onChange={handleInputChange} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control type="tel" name="phone" value={form.phone} onChange={handleInputChange} />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Place</Form.Label>
                        <Form.Control name="place" value={form.place} onChange={handleInputChange} />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Class Type</Form.Label>
                        <Form.Select name="class_type" value={form.class_type} onChange={handleInputChange}>
                          <option value="">Select</option>
                          <option value="Individual Offline">Individual Offline</option>
                          <option value="Individual Online">Individual Online</option>
                          <option value="Group Offline">Group Offline</option>
                          <option value="Group Online">Group Online</option>
                          <option value="Hybrid Monthly">Hybrid Monthly</option>
                          <option value="Yearly Plan">Yearly Plan</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Course</Form.Label>
                        <Form.Control name="course" value={form.course} onChange={handleInputChange} />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Level</Form.Label>
                        <Form.Control name="level" value={form.level} onChange={handleInputChange} placeholder="e.g. Beginner / Intermediate" />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Stage</Form.Label>
                        <Form.Select name="stage1" value={form.stage1} onChange={handleInputChange}>
                          <option value="">Select Stage</option>
                          <option value="Rookie">Rookie</option>
                          <option value="Dabbler">Dabbler</option>
                          <option value="Beginner 1">Beginner 1</option>
                          <option value="Beginner 2">Beginner 2</option>
                          <option value="Competent">Competent</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advance">Advance</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Batch Time</Form.Label>
                        <Form.Control type="text" name="batch_time" value={form.batch_time} onChange={handleInputChange} placeholder="e.g. Mon/Wed 6-7pm" />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Fees (₹)</Form.Label>
                        <Form.Control type="number" step="0.01" min="0" name="fees" value={form.fees} onChange={handleInputChange} />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Enquiry From</Form.Label>
                        <Form.Control
                          type="text"
                          name="enquiry_from"
                          placeholder="Enter enquiry source (Web, Justdial, Google, etc.)"
                          value={form.enquiry_from}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="modal-footer custom-modal-footer">
                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                  <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
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
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        .custom-modal-header, .custom-modal-footer {
          flex-shrink: 0;
          position: sticky;
          background: #fff;
          z-index: 1;
          padding: 1rem;
        }
        .custom-modal-header { top: 0; border-bottom: 1px solid #e9ecef; }
        .custom-modal-footer { bottom: 0; border-top: 1px solid #e9ecef; display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.75rem 1rem; }
        .custom-modal-body { overflow-y: auto; max-height: 70vh; padding: 1rem; }
      `}</style>
    </div>
  );
}
