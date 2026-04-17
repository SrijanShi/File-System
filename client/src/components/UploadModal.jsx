import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { imagesAPI } from '../api'
import { formatSize } from '../utils/format'
import { IconX, IconUpload, IconFile } from './Icons'

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

export default function UploadModal({ folderId, onClose, onUploaded }) {
  const [files,    setFiles]    = useState([])
  const [dragging, setDragging] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const inputRef = useRef()

  const addFiles = (incoming) => {
    const arr = Array.from(incoming)
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      return [...prev, ...arr.filter((f) => !names.has(f.name))]
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const removeFile = (name) =>
    setFiles((prev) => prev.filter((f) => f.name !== name))

  const handleUpload = async () => {
    if (files.length === 0) return setError('Select at least one image')
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('folderId', folderId)
      files.forEach((f) => form.append('images', f))
      const { data } = await imagesAPI.upload(form)
      onUploaded(data.images)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
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
          <div className="modal__hd">
            <span className="modal__title">Upload Images</span>
            <button className="modal__close" onClick={onClose}>
              <IconX size={14} />
            </button>
          </div>

          <div className="modal__body">
            {/* Drop zone */}
            <div
              className={`upload-zone ${dragging ? 'drag' : ''}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <span className="upload-zone__icon"><IconUpload size={24} /></span>
              <span className="upload-zone__text">Drop images or click to select</span>
              <span className="upload-zone__hint">
                {files.length > 0
                  ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
                  : 'JPEG, PNG, GIF, WebP — max 10 MB each'}
              </span>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => addFiles(e.target.files)}
            />

            {/* File list */}
            {files.length > 0 && (
              <motion.div
                className="file-list"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
              >
                {files.map((f) => (
                  <div key={f.name} className="file-item">
                    <IconFile size={13} />
                    <span className="file-item__name">{f.name}</span>
                    <span className="file-item__size">{formatSize(f.size)}</span>
                    <button
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--text-subtle)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', padding: 2,
                      }}
                      onClick={() => removeFile(f.name)}
                    >
                      <IconX size={12} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

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
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={loading || files.length === 0}
            >
              {loading ? <span className="spinner" /> : `Upload ${files.length > 0 ? files.length : ''}`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
