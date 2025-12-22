'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Button, Alert, Spinner } from 'react-bootstrap'
import { supabase } from '../../../lib/supabaseClient'
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleSignIn = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setErrorMsg('Invalid email or password. Please try again.')
      return
    }

    if (rememberMe) {
      localStorage.setItem('rememberEmail', email)
    }
    
    localStorage.setItem('isAuthenticated', 'true')
    router.push('/dashboard')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="logo-container">
           
            <h1 className="brand-title">Azroute Admin</h1>
          </div>
          <p className="brand-subtitle">Enterprise Management Portal</p>
          <div className="divider"></div>
        </div>

        {/* Form */}
        <div className="auth-form-container">
          <div className="form-header">
            <h2 className="form-title">Sign In</h2>
            <p className="form-subtitle">Enter your credentials to access the dashboard</p>
          </div>

          {errorMsg && (
            <Alert 
              variant="danger" 
              className="alert-custom"
              onClose={() => setErrorMsg('')}
              dismissible
            >
              {errorMsg}
            </Alert>
          )}

          <Form onSubmit={handleSignIn} className="auth-form">
            {/* Email Field */}
            <Form.Group className="form-group-custom" style={{ marginBottom: '25px' }}>
              <Form.Label className="form-label">
                <FiMail className="input-icon" />
                Email Address
              </Form.Label>
              <Form.Control
                type="email"
                placeholder="admin@azroute.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control-custom"
                required
                disabled={loading}
              />
            </Form.Group>

            {/* Password Field */}
            <Form.Group className="form-group-custom" style={{ marginBottom: '30px' }}>
              <Form.Label className="form-label">
                <FiLock className="input-icon" />
                Password
              </Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control-custom"
                required
                disabled={loading}
              />
            </Form.Group>

            {/* Submit Button */}
            <Button
              type="submit"
              className="auth-btn"
              disabled={loading || !email || !password}
              style={{ marginTop: '25px', width: '100%', height: '50px', fontWeight: '600' }}
            >
              {loading ? (
                <>
                  <Spinner
                    size="sm"
                    animation="border"
                    className="me-2"
                    variant="light"
                  />
                  Authenticating...
                </>
              ) : (
                <>
                  <FiLogIn className="me-2 auth-header" />
                  Login
                </>
              )}
            </Button>

            {/* Footer */}
          
          </Form>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="background-pattern"></div>

      {/* STYLES */}
      <style jsx>{`
        .form-label{
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-weight: 500;
          color: #01050bff;
        }

        .form-label .input-icon{
          font-size: 18px;
          color: #4f46e5;
        }

        .auth-container{
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #eef1ff;
          padding: 20px;
        }

        .auth-card{
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
        }

        .auth-header{
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          padding: 35px 25px;
          color: #fff;
          text-align: center;
          border-radius: 18px 18px 0 0;
        }

        .logo-container{
          margin-bottom: 15px;
        }

        .logo-icon{
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          background: rgba(255,255,255,0.2);
          border-radius: 12px;
          margin-bottom: 10px;
        }

        .brand-title{
          font-size: 28px;
          font-weight: 700;
          margin: 0;
        }

        .brand-subtitle{
          font-size: 14px;
          margin: 10px 0 0 0;
          opacity: 0.9;
        }

        .divider{
          height: 2px;
          background: rgba(255,255,255,0.2);
          margin-top: 20px;
        }

        .auth-form-container{
          background: #fff;
          padding: 35px 25px;
          border-radius: 0 0 18px 18px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        .form-header{
          margin-bottom: 30px;
        }

        .form-title{
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .form-subtitle{
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .form-control-custom{
          height: 50px;
          border-radius: 10px;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          font-size: 15px;
        }

        .form-control-custom:focus{
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .auth-footer{
          text-align: center;
        }

        .footer-text{
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .company-link{
          color: #4f46e5;
          text-decoration: none;
          font-weight: 600;
        }

        .company-link:hover{
          text-decoration: underline;
        }

        .background-pattern{
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(circle at 25px 25px, rgba(79, 70, 229, 0.05) 2%, transparent 0%);
          background-size: 50px 50px;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}