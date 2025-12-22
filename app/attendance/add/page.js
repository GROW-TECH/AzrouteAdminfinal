'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Container, Form, Button, Alert, Table } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

export default function AttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [attendanceData, setAttendanceData] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState('individual');

  useEffect(() => {
    const fetchDistinctClasses = async () => {
      setError('');
      const { data, error } = await supabase
        .from('student_list')
        .select('course')
        .neq('course', '')
        .order('course', { ascending: true })
        .limit(1000);

      if (error) {
        setError(error.message);
      } else {
        const distinctCourses = [...new Set((data || []).map((r) => r.course))];
        setClassOptions(distinctCourses);
      }
    };

    fetchDistinctClasses();
  }, []);

  useEffect(() => {
    const fetchStudentsByClass = async () => {
      setError('');
      setAttendanceData({}); // clear selections when class changes
      if (!selectedClass) {
        setStudents([]);
        return;
      }
      const { data, error } = await supabase
        .from('student_list')
        .select('id, name')
        .eq('course', selectedClass);

      if (error) setError(error.message);
      else setStudents(data || []);
    };
    fetchStudentsByClass();
  }, [selectedClass]);

  // NEW: load existing attendance for selectedDate + selectedClass to prefill the form
  useEffect(() => {
    const fetchExistingAttendance = async () => {
      if (!selectedDate || !selectedClass) {
        // don't prefill until both selected
        return setAttendanceData({});
      }
      try {
        const { data, error } = await supabase
          .from('attendance')
          .select('student_id, status')
          .eq('attendance_date', selectedDate)
          .eq('class_type', selectedClass);

        if (error) {
          console.error('fetchExistingAttendance error', error);
          return;
        }
        const map = {};
        (data || []).forEach((r) => {
          map[r.student_id] = r.status; // 'P' or 'A'
        });
        setAttendanceData(map);
      } catch (e) {
        console.error(e);
      }
    };
    fetchExistingAttendance();
  }, [selectedDate, selectedClass]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceData((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedDate) {
      setError('Select a date');
      return;
    }
    if (!selectedClass) {
      setError('Select a class');
      return;
    }
    if (students.length === 0) {
      setError('No students found for the selected class');
      return;
    }

    // only upsert students that have an explicit selection in attendanceData
    const changedStudentIds = Object.keys(attendanceData);
    if (changedStudentIds.length === 0) {
      setError('No attendance changes to save. Select Present/Absent for at least one student.');
      return;
    }

    setSaving(true);

    // Build records only for changed students
    const records = changedStudentIds.map((idStr) => {
      const id = parseInt(idStr, 10);
      return {
        student_id: id,
        attendance_date: selectedDate,
        status: attendanceData[id] || 'A',
        class_type: selectedClass,
        attendance_mode: attendanceMode,
      };
    });

    const { error: upsertError } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: ['student_id', 'attendance_date', 'class_type'] });

    setSaving(false);

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      setError(upsertError.message || 'Database error');
    } else {
      // optional: refresh existing attendance and students view
      router.push('/attendance');
    }
  };

  return (
    <Container className="p-4">
      <h2>Mark Attendance</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Select Date</Form.Label>
          <Form.Control
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
          />
        </Form.Group>

        {/* NEW DROPDOWN — INSERT EXACTLY HERE */}
        <Form.Group className="mb-3">
          <Form.Label>Attendance Type</Form.Label>
          <Form.Select
            value={attendanceMode}
            onChange={(e) => setAttendanceMode(e.target.value)}
          >
            <option value="individual">Individual Class</option>
            <option value="group">Group Class</option>
          </Form.Select>
        </Form.Group>
        {/* END NEW DROPDOWN */}

        <Form.Group className="mb-3">
          <Form.Label>Select Class</Form.Label>
          <Form.Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required>
            <option value="">-- Select Class --</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Table bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status (Present/Absent)</th>
            </tr>
          </thead>
          <tbody>
            {selectedClass && students.length === 0 && (
              <tr>
                <td colSpan="2" className="text-center">
                  No students found for this class.
                </td>
              </tr>
            )}
            {students.map((stu) => (
              <tr key={stu.id}>
                <td>{stu.name}</td>
                <td>
                  <Form.Check
                    inline
                    label="Present"
                    type="radio"
                    name={`status-${stu.id}`}
                    checked={attendanceData[stu.id] === 'P'}
                    onChange={() => handleStatusChange(stu.id, 'P')}
                  />
                  <Form.Check
                    inline
                    label="Absent"
                    type="radio"
                    name={`status-${stu.id}`}
                    checked={attendanceData[stu.id] === 'A'}
                    onChange={() => handleStatusChange(stu.id, 'A')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Attendance'}
        </Button>
      </Form>
    </Container>
  );
}
