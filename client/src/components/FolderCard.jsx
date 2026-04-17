import { motion } from 'framer-motion'
import { formatSize } from '../utils/format'
import { IconFolder } from './Icons'

export default function FolderCard({ folder, onClick }) {
  return (
    <motion.div
      className="folder-card"
      onClick={onClick}
      whileHover={{ y: -5, boxShadow: '0 10px 28px rgba(0,0,0,0.12)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      layout
    >
      <div className="folder-card__thumb">
        {folder.thumbnail?.url ? (
          <img src={folder.thumbnail.url} alt={folder.name} />
        ) : (
          <div
            style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-subtle)',
            }}
          >
            <IconFolder size={28} />
          </div>
        )}
      </div>
      <div className="folder-card__info">
        <div className="folder-card__name">{folder.name}</div>
        <div className="folder-card__meta">
          <span>{formatSize(folder.size)}</span>
        </div>
      </div>
    </motion.div>
  )
}
