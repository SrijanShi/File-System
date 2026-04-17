import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { foldersAPI } from '../api'
import FolderCard from '../components/FolderCard'
import CreateFolderModal from '../components/CreateFolderModal'
import { IconPlus, IconFolder } from '../components/Icons'

const container = {
  animate: { transition: { staggerChildren: 0.055 } },
}

const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
}

export default function DashboardPage() {
  const [folders,    setFolders]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    try {
      const { data } = await foldersAPI.getRoot()
      setFolders(data.folders)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreated = (folder) => {
    setFolders((prev) => [folder, ...prev])
  }

  const handleFolderClick = (folder) => {
    navigate(`/folder/${folder._id}`, {
      state: { path: [{ id: folder._id, name: folder.name }] },
    })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="page-header">
          <div className="page-header__left">
            <div className="page-title">My Drive</div>
            <div className="page-subtitle">
              {loading ? 'Loading...' : `${folders.length} folder${folders.length !== 1 ? 's' : ''}`}
            </div>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(true)}
            >
              <IconPlus size={14} />
              New Folder
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="section">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="spinner spinner--dark" />
            </div>
          ) : folders.length === 0 ? (
            <motion.div
              className="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="empty__icon"><IconFolder size={36} /></div>
              <div className="empty__title">No folders yet</div>
              <div className="empty__text">
                Create your first folder to start organising your files.
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => setShowCreate(true)}
              >
                <IconPlus size={14} />
                New Folder
              </button>
            </motion.div>
          ) : (
            <motion.div
              className="grid"
              variants={container}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence>
                {folders.map((f) => (
                  <motion.div key={f._id} variants={item}>
                    <FolderCard
                      folder={f}
                      onClick={() => handleFolderClick(f)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <CreateFolderModal
            parentId={null}
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
    </>
  )
}
