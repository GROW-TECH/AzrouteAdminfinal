'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Form, Row, Col, InputGroup, FormControl } from 'react-bootstrap';
import { supabase } from '../../lib/supabaseClient';

const emptyForm = {
  branch_name: '',
  username: '',
  email: '',
  password: '',
};

export default function BranchList() {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState('add');
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  // --- LOAD (normalized, filters out totally empty rows) ---
  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, branch_name, username, email, password')
      .order('branch_name', { ascending: true });

    if (error) {
      console.error('load profiles error', error);
      setRows([]);
      setFiltered([]);
      setLoading(false);
      return;
    }

    const normalized = (data || [])
      .map((r) => ({
        id: r.id,
        branch_name: r.branch_name ?? '',
        username: r.username ?? '',
        email: r.email ?? '',
        password: r.password ?? ''
      }))
      .filter((r) => r.branch_name.trim() || r.username.trim() || r.email.trim() || r.password.trim());

    setRows(normalized);
    setFiltered(normalized);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  // Do not prefill password with stored value for security
  function openEdit(row) {
    setMode('edit');
    setEditingId(row.id);
    setForm({
      branch_name: row.branch_name || '',
      username: row.username || '',
      email: row.email || '',
      password: '', // leave empty — admin must enter new password to change
    });
    setShowForm(true);
  }

  function close() {
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleInput(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleSearch(e) {
    const q = e.target.value.toLowerCase();
    setSearch(q);
    if (!q) return setFiltered(rows);
    setFiltered(
      rows.filter((r) =>
        (r.branch_name || '').toLowerCase().includes(q) ||
        (r.username || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q)
      )
    );
  }

  // helper to get current logged-in user (id)
  async function getCurrentUser() {
    const resp = await supabase.auth.getUser();
    return resp?.data?.user || null;
  }

  // --- CREATE: call admin endpoint then upsert profiles ---
  async function handleAdd(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      return alert('Email and password are required to create auth user');
    }

    setLoading(true);

    // 1) create auth user via server admin endpoint
    const resp = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        username: form.username,
        branch_name: form.branch_name
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      setLoading(false);
      return alert('Failed to create auth user: ' + (data?.error || resp.statusText));
    }

    const newId = data.id;
    if (!newId) {
      setLoading(false);
      return alert('Server did not return created user id — cannot proceed.');
    }

    // 2) upsert profile row (store plaintext if you want to show it)
    const profileRow = {
      id: newId,
      branch_name: form.branch_name,
      username: form.username,
      email: form.email,
      password: form.password
    };

    const { error } = await supabase
      .from('profiles')
      .upsert([profileRow], { onConflict: 'id' });

    if (error) {
      // optional: call server to delete created auth user if you want rollback
      setLoading(false);
      return alert('Profile upsert failed: ' + error.message);
    }

    // success
    setLoading(false);
    close();
    load();
  }

  // --- EDIT: update auth password via server (if password provided), then update profiles ---
  async function handleEdit(e) {
    e.preventDefault();
    if (!editingId) return;

    setLoading(true);

    const currentUser = await getCurrentUser();
    const isEditingSelf = currentUser && currentUser.id === editingId;

    // If password provided, update auth via server endpoint so it updates auth.users and profiles
    if (form.password && form.password.trim()) {
      try {
        const resp = await fetch('/api/set-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: editingId, newPassword: form.password })
        });
        const resData = await resp.json();
        if (!resp.ok) {
          setLoading(false);
          return alert('Failed to update auth password: ' + (resData?.error || resp.statusText));
        }
        // /api/set-password already upserted profiles.password; we'll still update other fields below
      } catch (err) {
        console.error('set-password error', err);
        setLoading(false);
        return alert('Failed to update auth password: ' + err.message);
      }
    }

    // Prepare profile update object (do not overwrite password with empty string)
    const updateProfile = {
      branch_name: form.branch_name,
      username: form.username,
      email: form.email,
      // only include password if admin typed it
      ...(form.password && form.password.trim() ? { password: form.password } : {})
    };

    // If editing self, we could use supabase.auth.updateUser for email changes,
    // but we prefer server update for passwords. If email changed for current user, call client update:
    if (isEditingSelf) {
      const clientUpdates = {};
      if (form.email) clientUpdates.email = form.email;
      // do not update password with client SDK (we used server) — skip password here
      if (Object.keys(clientUpdates).length > 0) {
        const { error: authErr } = await supabase.auth.updateUser(clientUpdates);
        if (authErr) {
          console.error('auth update error', authErr);
          // continue and attempt to update profiles anyway
        }
      }
    }

    // Update profiles row for other fields
    const { error } = await supabase.from('profiles').update(updateProfile).eq('id', editingId);
    if (error) {
      setLoading(false);
      return alert('Failed to update profile: ' + error.message);
    }

    setLoading(false);
    close();
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this branch?')) return;
    setLoading(true);

    // delete only profiles entry client-side; removing auth user requires server admin endpoint
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      setLoading(false);
      return alert(error.message);
    }

    setLoading(false);
    load();
  }

  return (
    <div className="container mt-4">
      <h2>Branch List</h2>

      <Row className="mb-3">
        <Col md={8}>
          <InputGroup>
            <FormControl
              placeholder="Search branch / username / email"
              value={search}
              onChange={handleSearch}
            />
            <Button onClick={() => setFiltered(rows)}>Reset</Button>
          </InputGroup>
        </Col>
        <Col md={4} className="text-end">
          <Button variant="success" onClick={openAdd}>+ Add Branch</Button>
        </Col>
      </Row>

      {showForm && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5>{mode === 'add' ? 'Add Branch' : 'Edit Branch'}</h5>
                <button className="btn-close" onClick={close}></button>
              </div>

              <form onSubmit={mode === 'add' ? handleAdd : handleEdit}>
                <div className="modal-body">
                  <Form.Group className="mb-2">
                    <Form.Label>Branch Name</Form.Label>
                    <Form.Control name="branch_name" value={form.branch_name} onChange={handleInput} required />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Username</Form.Label>
                    <Form.Control name="username" value={form.username} onChange={handleInput} required />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" name="email" value={form.email} onChange={handleInput} required />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>{mode === 'add' ? 'Password' : 'New Password (leave blank to keep)'}</Form.Label>
                    <Form.Control
                      name="password"
                      value={form.password}
                      onChange={handleInput}
                      placeholder={mode === 'edit' ? 'Enter new password to change' : ''}
                      required={mode === 'add'}
                    />
                  </Form.Group>
                </div>

                <div className="modal-footer">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Saving...' : (mode === 'add' ? 'Save' : 'Update')}
                  </Button>
                  <Button variant="secondary" onClick={close}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>Branch Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Password</th>
            <th style={{ width: 160 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">No data found.</td>
            </tr>
          ) : (
            filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.branch_name}</td>
                <td>{r.username}</td>
                <td>{r.email}</td>
                <td style={{ fontFamily: 'monospace' }}>{r.password || ''}</td>

                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="sm" variant="warning" onClick={() => openEdit(r)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <style jsx>{`
        .custom-modal-overlay {
          background: rgba(0,0,0,0.45);
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }
      `}</style>
    </div>
  );
}
