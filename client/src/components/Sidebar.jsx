import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useFolders } from '../context/FolderContext'
import { IconHardDrive, IconLogOut, IconFolder } from './Icons'
import ThemeToggle from './ThemeToggle'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { folders } = useFolders()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  const initial = user?.name?.charAt(0).toUpperCase() || '?'

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="sidebar__brand">
        <div className="sidebar__mark">FS</div>
        <span className="sidebar__name">FileSystem</span>
        <div style={{ marginLeft: 'auto' }}>
          <ThemeToggle />
        </div>
      </div>

      <nav className="sidebar__nav">
        <NavLink
          to="/drive"
          end
          className={({ isActive }) => 'sidebar__item' + (isActive ? ' active' : '')}
        >
          <IconHardDrive size={15} />
          My Drive
        </NavLink>

        {folders.length > 0 && (
          <>
            <div className="sidebar__section-label">Folders</div>
            <AnimatePresence initial={false}>
              {folders.map((f) => (
                <motion.div
                  key={f._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <NavLink
                    to={`/folder/${f._id}`}
                    className={({ isActive }) => 'sidebar__item sidebar__item--folder' + (isActive ? ' active' : '')}
                  >
                    <IconFolder size={14} />
                    <span className="sidebar__folder-name">{f.name}</span>
                  </NavLink>
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
      </nav>

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
