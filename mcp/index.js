import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_BASE = process.env.FILESYSTEM_API_URL || 'https://filesystem-srijan.fly.dev/api'
const TOKEN    = process.env.FILESYSTEM_TOKEN   || ''

// ── HTTP helper ────────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`)
  return data
}

// Find a root folder by name (case-insensitive)
async function findFolderByName(name) {
  const { folders } = await api('GET', '/folders')
  return folders.find((f) => f.name.toLowerCase() === name.toLowerCase()) || null
}

// Find a subfolder by name inside a parent
async function findSubfolderByName(parentId, name) {
  const { subfolders } = await api('GET', `/folders/${parentId}/children`)
  return subfolders.find((f) => f.name.toLowerCase() === name.toLowerCase()) || null
}

// Format bytes nicely
function fmt(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0; let v = bytes
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function text(str) {
  return { content: [{ type: 'text', text: str }] }
}

// ── Server ─────────────────────────────────────────────────────────────────────
const server = new McpServer({
  name:    'filesystem',
  version: '1.0.0',
})

// ── Tool: list_folders ─────────────────────────────────────────────────────────
server.tool(
  'list_folders',
  'List all root-level folders in the drive. Use get_folder_contents to see subfolders inside a specific folder.',
  {},
  async () => {
    const { folders } = await api('GET', '/folders')
    if (!folders.length) return text('No folders found in the drive.')
    const lines = folders.map(
      (f) => `• ${f.name}  [ID: ${f._id}]  ${fmt(f.size)}`
    )
    return text(`Root folders (${folders.length}):\n${lines.join('\n')}`)
  }
)

// ── Tool: get_folder_contents ──────────────────────────────────────────────────
server.tool(
  'get_folder_contents',
  'Get the subfolders and images inside a folder. Provide either the folder name (root-level) or its ID.',
  {
    folder_name: z.string().optional().describe('Name of the root-level folder'),
    folder_id:   z.string().optional().describe('Folder ID (use this for nested folders)'),
  },
  async ({ folder_name, folder_id }) => {
    let id = folder_id
    if (!id) {
      if (!folder_name) return text('Provide either folder_name or folder_id.')
      const f = await findFolderByName(folder_name)
      if (!f) return text(`No folder named "${folder_name}" found.`)
      id = f._id
    }
    const { folder, subfolders, images } = await api('GET', `/folders/${id}`)
    const lines = [`Folder: ${folder.name}  (${fmt(folder.size)} total)\n`]
    if (subfolders.length) {
      lines.push(`Subfolders (${subfolders.length}):`)
      subfolders.forEach((s) => lines.push(`  • ${s.name}  [ID: ${s._id}]  ${fmt(s.size)}`))
    }
    if (images.length) {
      lines.push(`\nImages (${images.length}):`)
      images.forEach((img) => lines.push(`  • ${img.name}  [ID: ${img._id}]  ${fmt(img.size)}`))
    }
    if (!subfolders.length && !images.length) lines.push('This folder is empty.')
    return text(lines.join('\n'))
  }
)

// ── Tool: create_folder ────────────────────────────────────────────────────────
server.tool(
  'create_folder',
  'Create a new folder. To create inside another folder, provide parent_folder_name (root-level parent) or parent_folder_id.',
  {
    name:               z.string().describe('Name for the new folder'),
    parent_folder_name: z.string().optional().describe('Name of the root-level parent folder'),
    parent_folder_id:   z.string().optional().describe('ID of the parent folder (use for nested parents)'),
  },
  async ({ name, parent_folder_name, parent_folder_id }) => {
    let parentId = parent_folder_id || null

    if (!parentId && parent_folder_name) {
      const parent = await findFolderByName(parent_folder_name)
      if (!parent) return text(`No folder named "${parent_folder_name}" found. Create it first.`)
      parentId = parent._id
    }

    const body = { name, ...(parentId && { parentId }) }
    const { folder } = await api('POST', '/folders', body)
    const location = parentId ? `inside "${parent_folder_name || parentId}"` : 'at root level'
    return text(`Created folder "${folder.name}" ${location}.\nID: ${folder._id}`)
  }
)

// ── Tool: delete_folder ────────────────────────────────────────────────────────
server.tool(
  'delete_folder',
  'Delete a folder and ALL its contents (subfolders + images). This cannot be undone.',
  {
    folder_name: z.string().optional().describe('Name of the root-level folder to delete'),
    folder_id:   z.string().optional().describe('ID of the folder to delete'),
  },
  async ({ folder_name, folder_id }) => {
    let id = folder_id
    if (!id) {
      if (!folder_name) return text('Provide either folder_name or folder_id.')
      const f = await findFolderByName(folder_name)
      if (!f) return text(`No folder named "${folder_name}" found.`)
      id = f._id
    }
    await api('DELETE', `/folders/${id}`)
    return text(`Deleted folder ${folder_name ? `"${folder_name}"` : id} and all its contents.`)
  }
)

// ── Tool: list_images ──────────────────────────────────────────────────────────
server.tool(
  'list_images',
  'List all images inside a folder.',
  {
    folder_name: z.string().optional().describe('Name of the root-level folder'),
    folder_id:   z.string().optional().describe('Folder ID'),
  },
  async ({ folder_name, folder_id }) => {
    let id = folder_id
    if (!id) {
      if (!folder_name) return text('Provide either folder_name or folder_id.')
      const f = await findFolderByName(folder_name)
      if (!f) return text(`No folder named "${folder_name}" found.`)
      id = f._id
    }
    const { images } = await api('GET', `/images/folder/${id}`)
    if (!images.length) return text('No images in this folder.')
    const lines = images.map((img) => `• ${img.name}  [ID: ${img._id}]  ${fmt(img.size)}  ${img.url}`)
    return text(`Images (${images.length}):\n${lines.join('\n')}`)
  }
)

// ── Tool: delete_image ─────────────────────────────────────────────────────────
server.tool(
  'delete_image',
  'Delete an image by its ID.',
  {
    image_id: z.string().describe('ID of the image to delete'),
  },
  async ({ image_id }) => {
    await api('DELETE', `/images/${image_id}`)
    return text(`Deleted image ${image_id}.`)
  }
)

// ── Tool: rename_folder ────────────────────────────────────────────────────────
server.tool(
  'rename_folder',
  'Rename a folder.',
  {
    folder_name: z.string().optional().describe('Current name of the root-level folder'),
    folder_id:   z.string().optional().describe('ID of the folder'),
    new_name:    z.string().describe('New name for the folder'),
  },
  async ({ folder_name, folder_id, new_name }) => {
    let id = folder_id
    if (!id) {
      if (!folder_name) return text('Provide either folder_name or folder_id.')
      const f = await findFolderByName(folder_name)
      if (!f) return text(`No folder named "${folder_name}" found.`)
      id = f._id
    }
    await api('PATCH', `/folders/${id}`, { name: new_name })
    return text(`Renamed folder to "${new_name}".`)
  }
)

// ── Start ──────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport()
await server.connect(transport)
