import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatSize } from '../utils/format'
import { IconX, IconChevronRight, IconArrowLeft, IconTrash } from './Icons'

export default function ImageLightbox({ images, initialIndex, onClose, onDelete }) {
  const [idx, setIdx] = useState(initialIndex)
  const image = images[idx]

  const prev = useCallback(() => setIdx((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length])
  const next = useCallback(() => setIdx((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  const handleDelete = () => {
    onDelete(image._id)
    if (images.length <= 1) { onClose(); return }
    setIdx((i) => (i >= images.length - 1 ? i - 1 : i))
  }

  return (
    <motion.div
      className="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      {/* Close */}
      <button className="lightbox__close" onClick={onClose}>
        <IconX size={15} />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          className="lightbox__nav lightbox__nav--prev"
          onClick={(e) => { e.stopPropagation(); prev() }}
        >
          <IconArrowLeft size={16} />
        </button>
      )}

      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={image._id}
          className="lightbox__img"
          src={image.url}
          alt={image.name}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
        />
      </AnimatePresence>

      {/* Next */}
      {images.length > 1 && (
        <button
          className="lightbox__nav lightbox__nav--next"
          onClick={(e) => { e.stopPropagation(); next() }}
        >
          <IconChevronRight size={16} />
        </button>
      )}

      {/* Info bar */}
      <div className="lightbox__info" onClick={(e) => e.stopPropagation()}>
        <span className="lightbox__info-name">{image.name}</span>
        <span className="lightbox__info-size">{formatSize(image.size)}</span>
        {images.length > 1 && (
          <span className="lightbox__info-count">{idx + 1} / {images.length}</span>
        )}
        <button
          onClick={handleDelete}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center',
            padding: '2px 0', transition: 'color 150ms',
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
          onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
          title="Delete image"
        >
          <IconTrash size={13} />
        </button>
      </div>
    </motion.div>
  )
}
