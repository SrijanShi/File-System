import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { foldersAPI } from '../api'
import { IconX, IconUpload } from './Icons'

const overlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
  transition: { duration: 0.18 },
}

const card = {
  initial: { opacity: 0, scale: 0.94, y: 10 },
  animate: { opacity: 1, scale: 1,    y: 0  },
  exit:    { opacity: 0, scale: 0.94, y: 10 },
  transition: { type: 'spring', stiffness: 380, damping: 30 },
}

export default function CreateFolderModal({ parentId = null, onClose, onCreated }) {
  const [name,     setName]     = useState('')
  const [file,     setFile]     = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const inputRef = useRef()

  const pickFile = (f) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) pickFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Folder name is required')
    if (!file)        return setError('Thumbnail image is required')

    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('name', name.trim())
      form.append('thumbnail', file)
      if (parentId) form.append('parentId', parentId)

      const { data } = await foldersAPI.create(form)
      onCreated(data.folder)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div className="modal-overlay" {...overlay} onClick={onClose}>
        <motion.div
          className="modal"
          {...card}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal__hd">
            <span className="modal__title">New Folder</span>
            <button className="modal__close" onClick={onClose}>
              <IconX size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal__body">
              {/* Name */}
              <div className="field">
                <label className="field-label">Folder Name</label>
                <input
                  className="input"
                  placeholder="Enter folder name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Thumbnail */}
              <div className="field">
                <label className="field-label">Cover Image</label>
                <div
                  className={`upload-zone ${dragging ? 'drag' : ''}`}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  {preview ? (
                    <img src={preview} alt="preview" className="upload-zone__preview" />
                  ) : (
                    <>
                      <span className="upload-zone__icon"><IconUpload size={22} /></span>
                      <span className="upload-zone__text">Drop or click to upload</span>
                      <span className="upload-zone__hint">JPEG, PNG, GIF, WebP — max 10 MB</span>
                    </>
                  )}
                  {preview && (
                    <span className="upload-zone__hint" style={{ marginTop: 6 }}>
                      {file?.name}
                    </span>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
              </div>

              {error && (
                <motion.div
                  className="auth-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}
            </div>

            <div className="modal__ft">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Create Folder'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
