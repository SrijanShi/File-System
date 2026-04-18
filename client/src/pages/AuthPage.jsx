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

export default function AuthPage() {
  const [mode,     setMode]     = useState('login')   // 'login' | 'signup' | 'otp'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [otp,      setOtp]      = useState(['', '', '', '', '', ''])
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [resendCd, setResendCd] = useState(0)

  const otpRefs = useRef([])
  const { login, loginWithToken } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const isSignup = mode === 'signup'
  const isOtp    = mode === 'otp'

  useEffect(() => {
    if (params.get('error') === 'oauth') setError('Sign-in failed. Please try again.')
  }, [params])

  useEffect(() => {
    if (resendCd <= 0) return
    const t = setTimeout(() => setResendCd((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCd])

  const reset = () => { setError(''); setName(''); setEmail(''); setPassword(''); setOtp(['','','','','','']) }

  const switchMode = (m) => { setMode(m); reset() }

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

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) return setError('Enter the 6-digit code')
    setError(''); setLoading(true)
    try {
      const { data } = await authAPI.verifyOtp({ email: email.trim(), code })
      loginWithToken(data.token, data.user)
      navigate('/drive', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code')
    } finally { setLoading(false) }
  }

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

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next)
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
        <div className="auth-brand">
          <div className="auth-mark">FS</div>
          <span className="auth-brand-name">FileSystem</span>
        </div>

        <AnimatePresence mode="wait">
          {/* OTP verification screen */}
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
            /* Login / Signup screen */
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
