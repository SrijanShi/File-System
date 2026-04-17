import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatSize } from '../utils/format'
import { IconTrash } from './Icons'

export default function ImageCard({ image, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  const handleDelete = (e) => {
    e.stopPropagation()
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 2500)
    } else {
      onDelete(image._id)
    }
  }

  return (
    <motion.div
      className="image-card"
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      layout
    >
      <img src={image.url} alt={image.name} />

      <div className="image-card__overlay">
        <div className="image-card__name">{image.name}</div>
        <div className="image-card__size">{formatSize(image.size)}</div>
      </div>

      <button
        className={`image-card__del ${confirming ? 'confirming' : ''}`}
        onClick={handleDelete}
        title={confirming ? 'Click again to confirm' : 'Delete image'}
      >
        {confirming ? (
          <span style={{ fontSize: 11, fontWeight: 500 }}>Confirm?</span>
        ) : (
          <IconTrash size={13} />
        )}
      </button>
    </motion.div>
  )
}
