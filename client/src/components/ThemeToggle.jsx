import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { IconSun, IconMoon } from './Icons'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button className="theme-toggle" onClick={toggle} title="Toggle theme">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
