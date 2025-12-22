'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function EmployeeAttendance() {

  /* ================= STATES ================= */

  const [employees, setEmployees] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [loading, setLoading] = useState(false);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('employee')
      .select('employee_id, name, role')
      .order('name', { ascending: true });

    setEmployees(data || []);
  };

  const fetchAttendance = async () => {
    const { data } = await supabase
      .from('employee_attendance')
      .select('*')
      .order('attendance_date', { ascending: false });

    setAttendanceList(data || []);
  };

  const selectedEmpObj = employees.find(
    (emp) => emp.employee_id == selectedEmployee
  );

  /* ================= SUBMIT ================= */

  const submitAttendance = async () => {

    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    if (!status) {
      alert('Please select attendance status');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('employee_attendance')
      .insert([
        {
          employee_name: selectedEmpObj.name,   // ✅ STORE NAME
          role: selectedEmpObj.role,
          attendance_date: selectedDate,
          status,
          leave_reason: status === 'Leave' ? leaveReason : null
        }
      ]);

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert('Attendance marked successfully');
      setStatus('');
      setLeaveReason('');
      fetchAttendance(); // refresh table
    }
  };

  /* ================= UI ================= */

  return (
    <div className="container my-4">

      <h3>Employee Attendance</h3>
      <p className="text-muted">Select employee, date and mark attendance</p>

      {/* FORM */}
      <div className="card p-4 mb-4">

        {/* EMPLOYEE */}
        <div className="mb-3">
          <label className="form-label">Employee</label>
          <select
            className="form-select"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">-- Select Employee --</option>
            {employees.map(emp => (
              <option key={emp.employee_id} value={emp.employee_id}>
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>
        </div>

        {/* DATE */}
        <div className="mb-3">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* STATUS */}
        <div className="d-flex gap-2 mb-3">
          <button
            className={`btn ${status === 'Present' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setStatus('Present')}
          >
            Present
          </button>

          <button
            className={`btn ${status === 'Absent' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setStatus('Absent')}
          >
            Absent
          </button>

          <button
            className={`btn ${status === 'Leave' ? 'btn-warning' : 'btn-outline-warning'}`}
            onClick={() => setStatus('Leave')}
          >
            Leave
          </button>
        </div>

        {/* LEAVE REASON */}
        {status === 'Leave' && (
          <textarea
            className="form-control mb-3"
            placeholder="Leave reason"
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
          />
        )}

        <button
          className="btn btn-primary w-100"
          onClick={submitAttendance}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Submit Attendance'}
        </button>
      </div>

      {/* TABLE */}
      <h5>Attendance Records</h5>

      <table className="table table-bordered table-striped text-center">
        <thead className="table-secondary">
          <tr>
            <th>#</th>
            <th>Employee Name</th>
            <th>Role</th>
            <th>Date</th>
            <th>Status</th>
            <th>Leave Reason</th>
          </tr>
        </thead>
        <tbody>
          {attendanceList.length === 0 ? (
            <tr>
              <td colSpan="6">No records found</td>
            </tr>
          ) : (
            attendanceList.map((row, i) => (
              <tr key={row.id}>
                <td>{i + 1}</td>
                <td>{row.employee_name || '—'}</td>
                <td>{row.role}</td>
                <td>{row.attendance_date}</td>
                <td>
                  <span
                    className={`badge ${
                      row.status === 'Present'
                        ? 'bg-success'
                        : row.status === 'Absent'
                        ? 'bg-danger'
                        : 'bg-warning'
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td>{row.leave_reason || '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

    </div>
  );
}
