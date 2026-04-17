import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { foldersAPI, imagesAPI } from '../api'
import FolderCard from '../components/FolderCard'
import ImageCard from '../components/ImageCard'
import CreateFolderModal from '../components/CreateFolderModal'
import UploadModal from '../components/UploadModal'
import ThemeToggle from '../components/ThemeToggle'
import { IconPlus, IconUpload, IconFolder, IconImage, IconChevronRight, IconArrowLeft } from '../components/Icons'
import { formatSize } from '../utils/format'

const container = {
  animate: { transition: { staggerChildren: 0.05 } },
}

const item = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] } },
}

export default function FolderPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { state }    = useLocation()

  const [folder,      setFolder]      = useState(null)
  const [subfolders,  setSubfolders]  = useState([])
  const [images,      setImages]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showCreate,  setShowCreate]  = useState(false)
  const [showUpload,  setShowUpload]  = useState(false)

  // Breadcrumb path from nav state, fallback to just this folder
  const [breadPath, setBreadPath] = useState(state?.path || [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await foldersAPI.getFolder(id)
      setFolder(data.folder)
      setSubfolders(data.subfolders)
      setImages(data.images)
      if (breadPath.length === 0) {
        setBreadPath([{ id: data.folder._id, name: data.folder.name }])
      }
    } catch {
      navigate('/drive', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleFolderClick = (sub) => {
    navigate(`/folder/${sub._id}`, {
      state: {
        path: [...breadPath, { id: sub._id, name: sub.name }],
      },
    })
  }

  const handleBreadNav = (idx) => {
    if (idx === breadPath.length - 1) return // current
    if (idx < 0) {
      navigate('/drive')
      return
    }
    const target = breadPath[idx]
    navigate(`/folder/${target.id}`, {
      state: { path: breadPath.slice(0, idx + 1) },
    })
  }

  const handleSubCreated = (newFolder) => {
    setSubfolders((prev) => [newFolder, ...prev])
  }

  const handleUploaded = (newImages) => {
    setImages((prev) => [...newImages, ...prev])
    // Update folder size locally
    const addedSize = newImages.reduce((s, img) => s + img.size, 0)
    setFolder((f) => f ? { ...f, size: (f.size || 0) + addedSize } : f)
  }

  const handleDeleteImage = async (imageId) => {
    try {
      await imagesAPI.remove(imageId)
      const removed = images.find((i) => i._id === imageId)
      setImages((prev) => prev.filter((i) => i._id !== imageId))
      if (removed) {
        setFolder((f) => f ? { ...f, size: Math.max(0, (f.size || 0) - removed.size) } : f)
      }
    } catch {}
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner spinner--dark" />
      </div>
    )
  }

  return (
    <>
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="page-header">
          <div className="page-header__left">
            {/* Breadcrumb */}
            <div className="breadcrumb">
              <button className="bc-item" onClick={() => handleBreadNav(-1)}>
                My Drive
              </button>
              {breadPath.map((crumb, idx) => (
                <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span className="bc-sep"><IconChevronRight /></span>
                  <button
                    className={`bc-item ${idx === breadPath.length - 1 ? 'active' : ''}`}
                    onClick={() => handleBreadNav(idx)}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </div>

            <div className="page-title" style={{ marginTop: 6 }}>
              {folder?.name}
            </div>
            <div className="page-subtitle">
              {formatSize(folder?.size || 0)} total
              {subfolders.length > 0 && ` · ${subfolders.length} subfolder${subfolders.length !== 1 ? 's' : ''}`}
              {images.length > 0 && ` · ${images.length} image${images.length !== 1 ? 's' : ''}`}
            </div>
          </div>

          <div className="page-header__actions">
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>
              <IconArrowLeft size={14} />
              Back
            </button>
            <ThemeToggle />
            <button className="btn btn-secondary" onClick={() => setShowCreate(true)}>
              <IconPlus size={14} />
              Folder
            </button>
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
              <IconUpload size={14} />
              Upload
            </button>
          </div>
        </div>

        {/* Subfolders */}
        {subfolders.length > 0 && (
          <div className="section">
            <div className="section-heading">
              <span className="section-title">Folders</span>
            </div>
            <motion.div
              className="grid"
              variants={container}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence>
                {subfolders.map((sf) => (
                  <motion.div key={sf._id} variants={item}>
                    <FolderCard
                      folder={sf}
                      onClick={() => handleFolderClick(sf)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div className="section">
            <div className="section-heading">
              <span className="section-title">Images</span>
            </div>
            <motion.div
              className="grid"
              variants={container}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence>
                {images.map((img) => (
                  <motion.div key={img._id} variants={item}>
                    <ImageCard
                      image={img}
                      onDelete={handleDeleteImage}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {/* Empty state */}
        {subfolders.length === 0 && images.length === 0 && (
          <motion.div
            className="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="empty__icon"><IconFolder size={36} /></div>
            <div className="empty__title">This folder is empty</div>
            <div className="empty__text">
              Add subfolders or upload images to get started.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowCreate(true)}>
                <IconPlus size={14} />
                New Folder
              </button>
              <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
                <IconUpload size={14} />
                Upload Images
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <CreateFolderModal
            parentId={id}
            onClose={() => setShowCreate(false)}
            onCreated={handleSubCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpload && (
          <UploadModal
            folderId={id}
            onClose={() => setShowUpload(false)}
            onUploaded={handleUploaded}
          />
        )}
      </AnimatePresence>
    </>
  )
}
