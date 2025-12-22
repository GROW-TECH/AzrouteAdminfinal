'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Row,
  Col,
  InputGroup,
  FormControl,
} from 'react-bootstrap';
import { supabase } from '../../lib/supabaseClient';

function generateRegNo() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

const initialIndividual = {
  name: '',
  reg_no: '',
  dob: '',
  email: '',
  phone: '',
  place: '',
  class_type: '',
  group_name: '',
  course: '',
  level: '',
  stage1: '',       // NEW
  batch_time: '',  // NEW (typing field)
  password: '',
  payment: '',
  status: 'Pending',
  fees: '',
};

export default function StudentList() {
  const RESTRICTED_UUID = '415ed8d0-547d-4c84-8f82-495e59dc834a';

  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState('add');
  const [formData, setFormData] = useState({ ...initialIndividual, reg_no: generateRegNo() });
  const [searchTerm, setSearchTerm] = useState('');
  const [classTypeFilter, setClassTypeFilter] = useState('');
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [courseOptions, setCourseOptions] = useState([]);

  const editInputStyle = {
    height: '32px',
    padding: '0 6px',
    fontSize: '0.85rem',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    boxSizing: 'border-box',
    verticalAlign: 'middle',
    width: '100%',
  };

  useEffect(() => {
    async function init() {
      let user = null;
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user || null;
        setCurrentUser(user);
      } catch (err) {
        console.error('Auth getUser error:', err);
        setCurrentUser(null);
      } finally {
        await fetchStudents(user);
        await fetchCourseOptions();
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStudents(userParam = null) {
    try {
      const user = userParam || currentUser;
      let query = supabase.from('student_list').select('*').order('id', { ascending: true });

      if (user && user.id === RESTRICTED_UUID) {
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Fetch students error:', error);
        setStudents([]);
        setFilteredStudents([]);
        return;
      }

      const normalized = (data || []).map((r) => ({ ...r, fees: r.fees !== null && r.fees !== undefined ? Number(r.fees) : null }));
      setStudents(normalized);
      setFilteredStudents(normalized);
    } catch (err) {
      console.error('Fetch students unexpected error:', err);
      setStudents([]);
      setFilteredStudents([]);
    }
  }

  async function fetchCourseOptions() {
    const { data, error } = await supabase.from('coaches').select('specialty');
    if (!error && data) {
      const specialties = [...new Set(data.map(row => row.specialty))];
      setCourseOptions(specialties);
    } else {
      console.error('Fetch course/specialty error:', error);
    }
  }

  function handleSearch() {
    let result = students;
    const term = searchTerm.trim().toLowerCase();
    if (classTypeFilter) {
      result = result.filter((stu) => (stu.class_type || '').toLowerCase() === classTypeFilter);
    }
    if (term) {
      result = result.filter((student) =>
        ['name', 'email', 'class_type', 'group_name', 'place'].some((field) =>
          (student[field] || '').toLowerCase().includes(term)
        )
      );
    }
    setFilteredStudents(result);
  }

  function handleSearchInput(e) {
    setSearchTerm(e.target.value);
  }

  function handleClassTypeFilterChange(e) {
    setClassTypeFilter(e.target.value.toLowerCase());
  }

  function openAddModal() {
    setMode('add');
    setFormData({ ...initialIndividual, reg_no: generateRegNo() });
    setShowForm(true);
    setEditingStudentId(null);
  }

  function openEditModal(student) {
    setMode('edit');
    setEditingStudentId(student.id);
    setFormData({
      id: student.id,
      name: student.name || '',
      reg_no: student.reg_no || student.regNo || '',
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
      password: student.password || '',
      payment: student.payment || '',
      status: student.status || 'Pending',
      fees: student.fees !== null && student.fees !== undefined ? student.fees : '',
      created_by: student.created_by || null,
    });
    setShowForm(true);
  }

  function closeModal() {
    setShowForm(false);
    setMode('add');
    setFormData({ ...initialIndividual, reg_no: generateRegNo() });
    setEditingStudentId(null);
    setInlineEditingId(null);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function initializeAttendanceForStudent(studentId) {
    const attendanceDates = Array.from({ length: 20 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (19 - i));
      return d.toISOString().slice(0, 10);
    });
    const attendanceData = attendanceDates.map((date) => ({
      student_id: studentId,
      attendance_date: date,
      status: 'A',
    }));
    // optional: insert attendance rows if you have attendance table
    // await supabase.from('attendance').insert(attendanceData);
  }

  async function handleAddSubmit(e) {
    e.preventDefault();

    const ownerId = currentUser?.id || null;

    const reg_no = formData.reg_no || generateRegNo();
    const insertData = {
      name: formData.name,
      reg_no,
      dob: formData.dob || null,
      email: formData.email || null,
      phone: formData.phone || null,
      place: formData.place || null,
      class_type: formData.class_type || 'Individual',
      group_name: formData.group_name || null,
      course: formData.course || null,
      level: formData.level || null,
      stage1: formData.stage1 || null,       // NEW
      batch_time: formData.batch_time || null, // NEW
      password: formData.password || '',
      payment: formData.payment || null,
      status: formData.status || 'Pending',
      fees: formData.fees === '' || formData.fees == null ? null : parseFloat(formData.fees),
      created_by: ownerId,
    };

    const { data, error } = await supabase.from('student_list').insert([insertData]).select('id, created_by');
    if (error) {
      alert('Insert failed: ' + error.message);
    } else {
      if (data && data.length > 0) {
        await initializeAttendanceForStudent(data[0].id);
      }
      closeModal();
      await fetchStudents(currentUser);
    }
  }

  function handleEditInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    const id = editingStudentId || formData.id;
    if (!id) {
      alert('No student selected to update.');
      return;
    }
    const updates = {
      name: formData.name,
      dob: formData.dob,
      email: formData.email,
      phone: formData.phone,
      place: formData.place,
      class_type: formData.class_type || 'Individual',
      group_name: formData.group_name || null,
      reg_no: formData.reg_no,
      course: formData.course,
      level: formData.level,
      stage1: formData.stage1 || null,       // NEW
      batch_time: formData.batch_time || null, // NEW
      password: formData.password || null,
      payment: formData.payment || null,
      status: formData.status || null,
      fees: formData.fees === '' || formData.fees == null ? null : parseFloat(formData.fees),
    };
    const { error } = await supabase.from('student_list').update(updates).eq('id', id);
    if (error) {
      alert('Update failed: ' + error.message);
    } else {
      closeModal();
      await fetchStudents(currentUser);
    }
  }

  async function deleteStudent(id) {
    if (!confirm('Are you sure to delete this student?')) return;
    const { error } = await supabase.from('student_list').delete().eq('id', id);
    if (error) {
      alert('Delete failed: ' + error.message);
    } else {
      await fetchStudents(currentUser);
    }
  }

  function startInlineEdit(student) {
    setInlineEditingId(student.id);
    setEditFormData({
      ...student,
      fees: student.fees !== null && student.fees !== undefined ? student.fees : '',
    });
  }

  function cancelInlineEdit() {
    setInlineEditingId(null);
    setEditFormData({});
  }

  async function saveInlineEdit() {
    const { id, ...updates } = editFormData;
    if (!editFormData.name) {
      alert('Name is required');
      return;
    }
    if (updates.fees === '' || updates.fees == null) {
      updates.fees = null;
    } else {
      updates.fees = parseFloat(updates.fees);
    }
    const { error } = await supabase.from('student_list').update(updates).eq('id', id);
    if (error) {
      alert('Update failed: ' + error.message);
    } else {
      setInlineEditingId(null);
      setEditFormData({});
      await fetchStudents(currentUser);
    }
  }

  return (
    <div className="container mt-4">
      <h2>Student List</h2>

      <Row className="align-items-center mb-3">
        <Col md={2}>
          <Form.Select value={classTypeFilter} onChange={handleClassTypeFilterChange}>
            <option value="">All Types</option>
             <option value="Individual Offline">Individual Offline</option>
                          <option value="Individual Online">Individual Online</option>
                          <option value="Group Offline">Group Offline</option>
                          <option value="Group Online">Group Online</option>
                          <option value="Hybrid Monthly">Hybrid Monthly</option>
                          <option value="Yearly Plan">Yearly Plan</option>
                          <option value="Campus">Campus</option>
          </Form.Select>
        </Col>
        <Col md={7}>
          <InputGroup>
            <FormControl placeholder="Search by name, email, class or group" value={searchTerm} onChange={handleSearchInput} style={{ borderRadius: '6px' }} />
            <Button variant="primary" onClick={handleSearch} style={{ minWidth: '85px', maxWidth: '100px', borderRadius: '6px' }}>
              Search
            </Button>
          </InputGroup>
        </Col>
        <Col md={3} className="text-end">
          <Button variant="success" onClick={openAddModal}>
            + Add Student
          </Button>
        </Col>
      </Row>

      {showForm && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog modal-lg">
            <div className="modal-content shadow custom-modal-content">
              <div className="modal-header custom-modal-header">
                <h5 className="modal-title">{mode === 'add' ? 'Add Student' : 'Edit Student'}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={mode === 'add' ? handleAddSubmit : handleEditSubmit}>
                <div className="modal-body custom-modal-body">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Class Type</Form.Label>
                        <Form.Select name="class_type" value={formData.class_type || ''} onChange={mode === 'add' ? handleInputChange : handleEditInputChange} required>
                          <option value="">Select</option>
                          <option value="Individual Offline">Individual Offline</option>
                          <option value="Individual Online">Individual Online</option>
                          <option value="Group Offline">Group Offline</option>
                          <option value="Group Online">Group Online</option>
                          <option value="Hybrid Monthly">Hybrid Monthly</option>
                          <option value="Yearly Plan">Yearly Plan</option>
                          <option value="Campus">Campus</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mt-2">
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Name</Form.Label>
                        <Form.Control name="name" value={formData.name || ''} onChange={mode === 'add' ? handleInputChange : handleEditInputChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Reg No</Form.Label>
                        <Form.Control name="reg_no" value={formData.reg_no} onChange={mode === 'add' ? handleInputChange : handleEditInputChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>DOB</Form.Label>
                        <Form.Control type="date" name="dob" value={formData.dob || ''} onChange={mode === 'add' ? handleInputChange : handleEditInputChange} />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" name="email" value={formData.email || ''} onChange={mode === 'add' ? handleInputChange : handleEditInputChange} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control type="tel" name="phone" value={formData.phone || ''} maxLength={10} onInput={(e) => (e.target.value = e.target.value.replace(/[^0-9]/g, ''))} onChange={mode === 'add' ? handleInputChange : handleEditInputChange} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Place</Form.Label>
                        <Form.Control type="text" name="place" value={formData.place || ''} onChange={mode === 'add' ? handleInputChange : handleEditInputChange} />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="text" name="password" placeholder="Set plain password" value={formData.password || ''} onChange={mode === 'add' ? handleInputChange : handleEditInputChange} />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Payment</Form.Label>
                        <Form.Select name="payment" value={formData.payment || ''} onChange={mode === 'add' ? handleInputChange : handleEditInputChange}>
                          <option value="">Select</option>
                          <option value="UPI">UPI</option>
                          <option value="Card">Card</option>
                          <option value="Cash">Cash</option>
                          <option value="NetBanking">Net Banking</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Status</Form.Label>
                        <Form.Select name="status" value={formData.status || 'Pending'} onChange={mode === 'add' ? handleInputChange : handleEditInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Refunded">Refunded</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Fees (₹)</Form.Label>
                        <Form.Control type="number" step="0.01" min="0" name="fees" value={formData.fees || ''} onChange={mode === 'add' ? handleInputChange : handleEditInputChange} />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Course</Form.Label>
                        <Form.Select
                          name="course"
                          value={formData.course || ''}
                          onChange={mode === 'add' ? handleInputChange : handleEditInputChange}
                        >
                          <option value="">Select Course</option>
                          {courseOptions.map((course, idx) => (
                            <option key={idx} value={course}>
                              {course}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Level</Form.Label>
                        <Form.Select name="level" value={formData.level || ''} onChange={mode === 'add' ? handleInputChange : handleEditInputChange}>
                          <option value="">Select Level</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {/* NEW: Stage1 select */}
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Stage</Form.Label>
                        <Form.Select name="stage1" value={formData.stage1 || ''} onChange={mode === 'add' ? handleInputChange : handleEditInputChange}>
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

                    {/* NEW: Batch time typing field */}
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Batch Time</Form.Label>
                        <Form.Control type="text" name="batch_time" placeholder="e.g. Mon/Wed 6-7pm" value={formData.batch_time || ''} onChange={mode === 'add' ? handleInputChange : handleEditInputChange} />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
                <div className="modal-footer custom-modal-footer">
                  <button type="submit" className="btn btn-primary">{mode === 'add' ? 'Save' : 'Update'}</button>
                  <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Table
        bordered
        hover
        responsive
        style={{
          tableLayout: 'fixed',
          fontSize: '0.90rem',
        }}
      >
        <thead>
          <tr>
            <th style={{ width: '90px' }}>Reg No</th>
            <th style={{ width: '140px' }}>Name</th>
            <th style={{ width: '110px' }}>DOB</th>
            <th style={{ width: '220px' }}>Email</th>
            <th style={{ width: '110px' }}>Phone</th>
            <th style={{ width: '100px' }}>Place</th>
            <th style={{ width: '100px' }}>Class Type</th>
            <th style={{ width: '110px' }}>Course</th>
            <th style={{ width: '90px' }}>Level</th>
            <th style={{ width: '110px' }}>Stage</th> {/* NEW */}
            <th style={{ width: '140px' }}>Batch Time</th> {/* NEW */}
            <th style={{ width: '110px' }}>Payment</th>
            <th style={{ width: '90px' }}>Status</th>
            <th style={{ width: '90px' }}>Fees (₹)</th>
            <th style={{ width: '140px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length === 0 ? (
            <tr>
              <td colSpan="15" className="text-center">No students found.</td>
            </tr>
          ) : (
            filteredStudents.map((student) => (
              <tr key={student.id}>
                <td style={{ whiteSpace: 'normal' }}>{student.reg_no}</td>
                <td style={{ whiteSpace: 'normal' }}>{student.name}</td>
                <td style={{ whiteSpace: 'normal' }}>{student.dob}</td>
                <td style={{ whiteSpace: 'normal' }}>{student.email}</td>
                <td style={{ whiteSpace: 'normal' }}>{student.phone}</td>
                <td style={{ whiteSpace: 'normal' }}>{student.place}</td>
                <td style={{ whiteSpace: 'normal' }}>{student.class_type}</td>
                <td style={{ whiteSpace: 'normal' }}>{student.course}</td>
                <td style={{ whiteSpace: 'normal' }}>{student.level}</td>
                <td style={{ whiteSpace: 'normal' }}>{student.stage1}</td> {/* NEW */}
                <td style={{ whiteSpace: 'normal' }}>{student.batch_time}</td> {/* NEW */}
                <td style={{ whiteSpace: 'normal' }}>{student.payment || ''}</td>
                <td style={{ whiteSpace: 'normal' }}>{student.status || 'Pending'}</td>
                <td style={{ whiteSpace: 'normal' }}>{student.fees !== null && student.fees !== undefined ? Number(student.fees).toFixed(2) : ''}</td>
                <td style={{ whiteSpace: 'normal' }}>
                  <div style={{ display: 'flex', gap: '8px', flexDirection: 'row' }}>
                    <Button variant="warning" size="sm" onClick={() => openEditModal(student)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => deleteStudent(student.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

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
        table thead th, table tbody td { vertical-align: middle; }
      `}</style>
    </div>
  );
}
