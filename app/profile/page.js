'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Container, Row, Col, Form, Card, Button, Alert } from 'react-bootstrap'

export default function Profile() {
  const router = useRouter()
  const [profileUsername, setProfileUsername] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [storedProfilePassword, setStoredProfilePassword] = useState(null)

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      setError('')
      setMessage('')

      const { data: userData, error: userError } = await supabase.auth.getUser()
      const user = userData?.user

      if (userError || !user) {
        router.push('/Authentication/sign-in')
        setLoading(false)
        return
      }

      setUserId(user.id)
      setProfileEmail(user.email || '')

      // fetch username + password only
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, password')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('profile fetch error', profileError)
        setError('Failed to load profile (DB error)')
        setLoading(false)
        return
      }

      if (!profileData) {
        const { error: insErr } = await supabase.from('profiles').insert([
          { id: user.id, username: null, password: null }
        ])
        if (insErr) {
          setError('Failed to initialize profile')
          setLoading(false)
          return
        }
        setProfileUsername('')
        setStoredProfilePassword(null)
        setCurrentPassword('')
      } else {
        setProfileUsername(profileData.username || '')
        setStoredProfilePassword(profileData.password ?? null)
        setCurrentPassword(profileData.password ?? '')
      }

      setLoading(false)
    }

    fetchProfile()
  }, [router])

  const handleUpdate = async () => {
    setError('')
    setMessage('')

    if (!userId) {
      setError('User not found')
      return
    }

    const profileUpdates = {
      username: profileUsername,
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (storedProfilePassword !== null && currentPassword !== storedProfilePassword) {
        setError('Current password is incorrect')
        return
      }

      const { error: authErr } = await supabase.auth.updateUser({ password: newPassword })
      if (authErr) {
        setError('Failed to update password (auth)')
        return
      }

      profileUpdates.password = newPassword
    }

    const { error: updErr } = await supabase.from('profiles').update(profileUpdates).eq('id', userId)
    if (updErr) {
      setError('Failed to update profile')
      return
    }

    if (profileUpdates.password) {
      setStoredProfilePassword(profileUpdates.password)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }

    setMessage('Profile updated successfully')
  }

  if (loading) return <div>Loading profile...</div>

  return (
    <Container fluid className="p-6">
      <Card className="mb-4 p-4 shadow-sm">
        <Row className="align-items-center">
          <Col xs={12} md={6}>
            <h4>Profile Details</h4>
            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}
            <Form>

              <Form.Group controlId="profileUsername" className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId="profileEmail" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={profileEmail} readOnly />
              </Form.Group>

              <Form.Group controlId="currentPassword" className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </Form.Group>

              <Form.Group controlId="newPassword" className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </Form.Group>

              <Form.Group controlId="confirmPassword" className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </Form.Group>

              <Button variant="primary" onClick={handleUpdate}>Save Changes</Button>

            </Form>
          </Col>
        </Row>
      </Card>
    </Container>
  )
}
