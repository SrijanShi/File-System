import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { IconHardDrive, IconLogOut } from './Icons'
import ThemeToggle from './ThemeToggle'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  const initial  = user?.name?.charAt(0).toUpperCase() || '?'

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__mark">FS</div>
        <span className="sidebar__name">FileSystem</span>
      </div>

      {/* Nav */}
      <nav className="sidebar__nav">
        <div className="sidebar__label">Storage</div>
        <NavLink
          to="/drive"
          className={({ isActive }) =>
            'sidebar__item' + (isActive ? ' active' : '')
          }
        >
          <IconHardDrive size={15} />
          My Drive
        </NavLink>

        <div className="sidebar__divider" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
          <span className="sidebar__label" style={{ marginBottom: 0 }}>Appearance</span>
          <ThemeToggle />
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">{initial}</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user?.name}</div>
            <div className="sidebar__user-email">{user?.email}</div>
          </div>
        </div>
        <button className="sidebar__item" onClick={handleLogout}>
          <IconLogOut size={15} />
          Sign out
        </button>
      </div>
    </motion.aside>
  )
}
