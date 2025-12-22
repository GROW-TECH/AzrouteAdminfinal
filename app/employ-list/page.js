'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function EmployeeList() {

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    role: ''
  });

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employee')
      .select('*')
      .order('employee_id', { ascending: true });

    if (!error) setEmployees(data || []);
    setLoading(false);
  };

  /* ================= HANDLERS ================= */

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      location: '',
      role: ''
    });
    setShowForm(true);
  };

  const handleEdit = (emp) => {
    setEditingId(emp.employee_id);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      location: emp.location || '',
      role: emp.role
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this employee?')) return;

    const { error } = await supabase
      .from('employee')
      .delete()
      .eq('employee_id', id);

    if (error) {
      alert(error.message);
    } else {
      fetchEmployees();
    }
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      // UPDATE
      const { error } = await supabase
        .from('employee')
        .update(formData)
        .eq('employee_id', editingId);

      if (error) return alert(error.message);
    } else {
      // INSERT
      const { error } = await supabase
        .from('employee')
        .insert([formData]);

      if (error) return alert(error.message);
    }

    setShowForm(false);
    setEditingId(null);
    fetchEmployees();
  };

  /* ================= UI ================= */

  return (
    <div className="container my-4">

      <div className="d-flex justify-content-between mb-3">
        <h4>Employee List</h4>
        <button className="btn btn-success" onClick={handleAdd}>
          + Add Employee
        </button>
      </div>

      {/* ADD / EDIT FORM */}
      {showForm && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5>{editingId ? 'Edit Employee' : 'Add Employee'}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowForm(false)}
                  />
                </div>

                <div className="modal-body">
                  <input
                    required
                    name="name"
                    className="form-control mb-2"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />

                  <input
                    required
                    type="email"
                    name="email"
                    className="form-control mb-2"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />

                  <input
                    required
                    name="phone"
                    className="form-control mb-2"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />

                  <input
                    name="location"
                    className="form-control mb-2"
                    placeholder="Location"
                    value={formData.location}
                    onChange={handleInputChange}
                  />

                  <input
  name="role"
  className="form-control mb-2"
  placeholder="Role"
  value={formData.role}          // ✅ FIXED
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
          <thead className="table-secondary">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, i) => (
              <tr key={emp.employee_id}>
                <td>{i + 1}</td>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>{emp.phone}</td>
                <td>{emp.location || '—'}</td>
                <td>{emp.role}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm me-1"
                    onClick={() => handleEdit(emp)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(emp.employee_id)}
                  >
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
