import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { IconSun, IconMoon } from '../components/Icons'

const field = {
  initial: { opacity: 0, height: 0, marginBottom: 0 },
  animate: { opacity: 1, height: 'auto', marginBottom: 15 },
  exit:    { opacity: 0, height: 0, marginBottom: 0 },
  transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
}

export default function AuthPage() {
  const [mode,     setMode]     = useState('login')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const { login, signup } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const isSignup = mode === 'signup'

  const reset = () => { setError(''); setName(''); setEmail(''); setPassword('') }

  const toggle_mode = () => { setMode((m) => (m === 'login' ? 'signup' : 'login')); reset() }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignup) {
        await signup(name.trim(), email.trim(), password)
      } else {
        await login(email.trim(), password)
      }
      navigate('/drive', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Theme toggle — top right */}
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

        {/* Heading */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: isSignup ? 8 : -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isSignup ? -8 : 8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="auth-title">
              {isSignup ? 'Create an account' : 'Welcome back'}
            </div>
            <div className="auth-subtitle">
              {isSignup
                ? 'Sign up to start managing your files'
                : 'Sign in to your account to continue'}
            </div>
          </motion.div>
        </AnimatePresence>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Name — signup only */}
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
                  required={isSignup}
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

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="auth-error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : isSignup ? (
              'Create account'
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          <button className="auth-link" onClick={toggle_mode}>
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
