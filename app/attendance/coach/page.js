'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function CoachAttendance() {

  const [coaches, setCoaches] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);

  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [selectedCoachName, setSelectedCoachName] = useState('');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [loading, setLoading] = useState(false);

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    fetchCoaches();
    fetchAllAttendance(); // ✅ show ALL data by default
  }, []);

  /* ================= LOAD COACHES ================= */

  const fetchCoaches = async () => {
    const { data } = await supabase
      .from('coaches')
      .select('id, name')
      .order('name');

    setCoaches(data || []);
  };

  /* ================= FETCH ATTENDANCE ================= */

  const fetchAllAttendance = async () => {
    const { data } = await supabase
      .from('coach_attendance')
      .select('*')
      .order('date', { ascending: false });

    setAttendanceList(data || []);
  };

  const fetchAttendanceByCoach = async (coachId) => {
    const { data } = await supabase
      .from('coach_attendance')
      .select('*')
      .eq('coach_id', coachId)
      .order('date', { ascending: false });

    setAttendanceList(data || []);
  };

  /* ================= SELECT COACH ================= */

  const handleCoachSelect = (coachId) => {
    setSelectedCoachId(coachId);

    if (!coachId) {
      setSelectedCoachName('');
      fetchAllAttendance(); // back to all data
      return;
    }

    const coach = coaches.find(c => c.id === Number(coachId));
    setSelectedCoachName(coach?.name || '');

    fetchAttendanceByCoach(Number(coachId));
  };

  /* ================= SUBMIT ATTENDANCE ================= */

  const submitAttendance = async () => {
    if (!selectedCoachId || !status) {
      alert('Select coach and status');
      return;
    }

    if (status === 'leave' && !leaveReason) {
      alert('Enter leave reason');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('coach_attendance')
      .upsert(
        {
          coach_id: Number(selectedCoachId),
          coach_name: selectedCoachName,
          date,
          status,
          leave_reason: status === 'leave' ? leaveReason : null,
          leave_status: status === 'leave' ? 'pending' : null
        },
        { onConflict: 'coach_id,date' }
      );

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      setStatus('');
      setLeaveReason('');
      selectedCoachId
        ? fetchAttendanceByCoach(Number(selectedCoachId))
        : fetchAllAttendance();
    }
  };

  /* ================= APPROVE LEAVE ================= */

  const approveLeave = async (id) => {
    const ok = confirm('Approve leave and mark as Absent?');
    if (!ok) return;

    await supabase
      .from('coach_attendance')
      .update({
        status: 'absent',
        leave_status: 'approved'
      })
      .eq('id', id);

    selectedCoachId
      ? fetchAttendanceByCoach(Number(selectedCoachId))
      : fetchAllAttendance();
  };

  /* ================= UI ================= */

  return (
    <div className="container my-4">

      <h3>Coach Attendance</h3>

      {/* ===== SELECT COACH ===== */}
      <label className="form-label">Select Coach (optional)</label>
      <select
        className="form-select mb-3"
        value={selectedCoachId}
        onChange={(e) => handleCoachSelect(e.target.value)}
      >
        <option value="">-- All Coaches --</option>
        {coaches.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* ===== FORM ===== */}
      {selectedCoachId && (
        <div className="card p-3 mb-4">
          <input
            type="date"
            className="form-control mb-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="d-flex gap-2 mb-2">
            <button
              className={`btn ${status === 'present' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setStatus('present')}
            >
              Present
            </button>

            <button
              className={`btn ${status === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setStatus('absent')}
            >
              Absent
            </button>

            <button
              className={`btn ${status === 'leave' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setStatus('leave')}
            >
              Leave
            </button>
          </div>

          {status === 'leave' && (
            <textarea
              className="form-control mb-2"
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
            Submit
          </button>
        </div>
      )}

      {/* ===== TABLE (ALL DATA) ===== */}
      <table className="table table-bordered text-center">
        <thead className="table-secondary">
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Status</th>
            <th>Leave Reason</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {attendanceList.length === 0 ? (
            <tr><td colSpan="5">No records</td></tr>
          ) : attendanceList.map(row => (
            <tr key={row.id}>
              <td>{row.coach_name}</td>
              <td>{row.date}</td>
              <td>
                {row.status === 'present' && <span className="badge bg-success">Present</span>}
                {row.status === 'absent' && <span className="badge bg-danger">Absent</span>}
                {row.status === 'leave' && <span className="badge bg-warning">Leave</span>}
              </td>
              <td>{row.leave_reason || '—'}</td>
              <td>
                {row.leave_status === 'pending' ? (
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => approveLeave(row.id)}
                  >
                    Pending
                  </button>
                ) : row.leave_status === 'approved' ? (
                  <span className="badge bg-success">Approved</span>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
