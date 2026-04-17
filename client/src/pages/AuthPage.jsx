import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { authAPI } from '../api'
import { IconSun, IconMoon } from '../components/Icons'

const field = {
  initial: { opacity: 0, height: 0, marginBottom: 0 },
  animate: { opacity: 1, height: 'auto', marginBottom: 15 },
  exit:    { opacity: 0, height: 0, marginBottom: 0 },
  transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
}

// Google "G" SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

export default function AuthPage() {
  const [mode,     setMode]     = useState('login')   // 'login' | 'signup' | 'otp'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [otp,      setOtp]      = useState(['', '', '', '', '', ''])
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [resendCd, setResendCd] = useState(0)         // countdown seconds

  const otpRefs = useRef([])
  const { login } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const isSignup = mode === 'signup'
  const isOtp    = mode === 'otp'

  // Show oauth error if redirected back with ?error=oauth
  useEffect(() => {
    if (params.get('error') === 'oauth') setError('Google sign-in failed. Please try again.')
  }, [params])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCd <= 0) return
    const t = setTimeout(() => setResendCd((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCd])

  const reset = () => { setError(''); setName(''); setEmail(''); setPassword(''); setOtp(['','','','','','']) }

  const switchMode = (m) => { setMode(m); reset() }

  // ── Standard login ──────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/drive', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally { setLoading(false) }
  }

  // ── Send OTP (signup step 1) ─────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await authAPI.sendOtp({ name: name.trim(), email: email.trim(), password })
      setMode('otp')
      setResendCd(60)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally { setLoading(false) }
  }

  // ── Verify OTP (signup step 2) ───────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) return setError('Enter the 6-digit code')
    setError(''); setLoading(true)
    try {
      const { data } = await authAPI.verifyOtp({ email: email.trim(), code })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/drive', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code')
    } finally { setLoading(false) }
  }

  // ── Resend OTP ───────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCd > 0) return
    setError(''); setLoading(true)
    try {
      await authAPI.sendOtp({ name: name.trim(), email: email.trim(), password })
      setOtp(['','','','','',''])
      setResendCd(60)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend')
    } finally { setLoading(false) }
  }

  // ── OTP input handling ───────────────────────────────────────────
  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    const next = text.split('').concat(Array(6).fill('')).slice(0, 6)
    setOtp(next)
    otpRefs.current[Math.min(text.length, 5)]?.focus()
    e.preventDefault()
  }

  // ── Google OAuth ─────────────────────────────────────────────────
  const handleGoogle = () => {
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="auth-page">
      <button
        className="theme-toggle"
        onClick={toggle}
        style={{ position: 'fixed', top: 20, right: 20 }}
        title="Toggle theme"
      >
        {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
      </button>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-mark">FS</div>
          <span className="auth-brand-name">FileSystem</span>
        </div>

        <AnimatePresence mode="wait">
          {/* ── OTP screen ── */}
          {isOtp ? (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="auth-title">Check your email</div>
              <div className="auth-subtitle">
                We sent a 6-digit code to <strong>{email}</strong>
              </div>

              <form className="auth-form" onSubmit={handleVerifyOtp}>
                <div className="field">
                  <label className="field-label">Verification code</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        className="input input-otp"
                        value={digit}
                        maxLength={1}
                        inputMode="numeric"
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKey(i, e)}
                        onPaste={handleOtpPaste}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div className="auth-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Verify & create account'}
                </button>

                <div className="auth-footer" style={{ marginTop: 12 }}>
                  Didn't receive it?
                  <button
                    type="button"
                    className="auth-link"
                    onClick={handleResend}
                    disabled={resendCd > 0}
                    style={{ opacity: resendCd > 0 ? 0.45 : 1 }}
                  >
                    {resendCd > 0 ? `Resend in ${resendCd}s` : 'Resend'}
                  </button>
                </div>
                <div className="auth-footer">
                  <button type="button" className="auth-link" onClick={() => switchMode('signup')}>
                    Back
                  </button>
                </div>
              </form>
            </motion.div>

          ) : (
            /* ── Login / Signup screen ── */
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: isSignup ? 8 : -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignup ? -8 : 8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="auth-title">{isSignup ? 'Create an account' : 'Welcome back'}</div>
              <div className="auth-subtitle">
                {isSignup ? 'Sign up to start managing your files' : 'Sign in to your account to continue'}
              </div>

              {/* Google button */}
              <button type="button" className="btn-google" onClick={handleGoogle}>
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="auth-divider"><span>or</span></div>

              <form className="auth-form" onSubmit={isSignup ? handleSendOtp : handleLogin}>
                <AnimatePresence>
                  {isSignup && (
                    <motion.div className="field" {...field}>
                      <label className="field-label">Full Name</label>
                      <input
                        className="input"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        required
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="field">
                  <label className="field-label">Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="field">
                  <label className="field-label">Password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder={isSignup ? 'At least 6 characters' : ''}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    required
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div className="auth-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <span className="spinner" /> : isSignup ? 'Send verification code' : 'Sign in'}
                </button>
              </form>

              <div className="auth-footer">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}
                <button className="auth-link" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>
                  {isSignup ? 'Sign in' : 'Sign up'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
