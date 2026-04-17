import { motion } from 'framer-motion'
import { formatSize } from '../utils/format'

// Distinct gradients assigned by first letter — no two consecutive chars share one
const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#30cfd0,#5433ff)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ff9a9e,#fad0c4)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#96fbc4,#f9f586)',
]

const getBg = (name) =>
  GRADIENTS[(name?.charCodeAt(0) ?? 0) % GRADIENTS.length]

export default function FolderCard({ folder, onClick }) {
  const hasThumbnail = !!folder.thumbnail?.url

  return (
    <motion.div
      className="folder-card"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      layout
    >
      {/* Background layer */}
      <div
        className="folder-card__bg"
        style={!hasThumbnail ? { background: getBg(folder.name) } : undefined}
      >
        {hasThumbnail && (
          <img src={folder.thumbnail.url} alt={folder.name} />
        )}
      </div>

      {/* Letter initial (shown when no thumbnail) */}
      {!hasThumbnail && (
        <div className="folder-card__initial">
          {folder.name?.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Gradient scrim */}
      <div className="folder-card__scrim" />

      {/* Info */}
      <div className="folder-card__info">
        <div className="folder-card__name">{folder.name}</div>
        <div className="folder-card__meta">{formatSize(folder.size)}</div>
      </div>
    </motion.div>
  )
}
