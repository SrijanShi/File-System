import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    const error = params.get('error')

    if (error || !token) {
      navigate('/auth?error=oauth', { replace: true })
      return
    }

    // Fetch current user info using the token
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        loginWithToken(token, data.user)
        navigate('/drive', { replace: true })
      })
      .catch(() => navigate('/auth?error=oauth', { replace: true }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span className="spinner" style={{ width: 24, height: 24 }} />
    </div>
  )
}
