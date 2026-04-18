import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { foldersAPI } from '../api'
import { useAuth } from './AuthContext'

const FolderContext = createContext(null)

export function FolderProvider({ children }) {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const load = useCallback(async () => {
    if (!user) { setFolders([]); setLoading(false); return }
    try {
      const { data } = await foldersAPI.getRoot()
      setFolders(data.folders)
    } catch {}
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { load() }, [load])

  const addFolder   = (folder) => setFolders((prev) => [folder, ...prev])
  const removeFolder = (id)   => setFolders((prev) => prev.filter((f) => f._id !== id))

  return (
    <FolderContext.Provider value={{ folders, loading, addFolder, removeFolder, refresh: load }}>
      {children}
    </FolderContext.Provider>
  )
}

export const useFolders = () => useContext(FolderContext)
