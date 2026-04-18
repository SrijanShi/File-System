# FileSystem

A Google Drive-style file manager. Users can register, create nested folders, and upload images. Each user only sees their own data.

**Live:** https://filesystem-srijan.fly.dev

---

## Test Credentials

```
Email:    test@filesystem.com
Password: test123
```

> These are pre-seeded on the live deployment. You can also register a new account — email OTP verification is enabled (uses Gmail SMTP).

---

## What's Built

**Auth**
- Register with email + OTP verification (6-digit code sent to inbox)
- JWT-based sessions, bcrypt password hashing
- Tokens stored in localStorage, protected routes on the frontend

**Folders**
- Create folders at root or nested inside other folders (unlimited depth)
- Optional cover image per folder — falls back to a generated gradient if none uploaded
- Folder size is computed recursively: it sums all image sizes at every depth level, not just direct children
- Cascading delete — removing a folder removes all descendant folders, images, and their files from disk

**Images**
- Upload multiple images at once into any folder
- Click any image to open a full-screen lightbox with keyboard navigation (← → Esc)
- Delete from the lightbox or the grid

**UI**
- Dark / light mode (persisted)
- Sidebar lists all your root folders, updates instantly when you create one
- Framer Motion animations throughout — page transitions, staggered grid, spring physics on cards

---

## Tech Stack

| Layer    | Choice                                      |
|----------|---------------------------------------------|
| Backend  | Node.js, Express 5, Mongoose                |
| Database | MongoDB (Atlas in production)               |
| Auth     | JWT + bcryptjs, Nodemailer OTP via Gmail    |
| Uploads  | Multer (disk storage), served as static     |
| Frontend | React 18, Vite, React Router v6             |
| Animations | Framer Motion                             |
| Deployment | Fly.io (full-stack), MongoDB Atlas        |

---

## Running Locally

**Prerequisites:** Node.js 20+, MongoDB running locally

```bash
# Clone
git clone https://github.com/SrijanShi/File-System.git
cd File-System

# Backend
cd server
cp .env.example .env        # fill in your values
npm install
npm run dev                 # runs on :5000

# Frontend (new terminal)
cd ../client
npm install
npm run dev                 # runs on :5173, proxies /api to :5000
```

**Minimum `.env` to get started locally:**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/filesystem_db
JWT_SECRET=any_long_random_string_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

SMTP vars (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) are only needed for OTP emails. Without them, signup will error at the OTP step — you can still use the `/api/auth/signup` endpoint directly to create accounts for local testing.

---

## Project Structure

```
FileSystem/
├── client/          # React + Vite frontend
│   └── src/
│       ├── api/         # Axios instance + endpoint wrappers
│       ├── components/  # FolderCard, ImageCard, Lightbox, Sidebar, Modals
│       ├── context/     # AuthContext, ThemeContext, FolderContext
│       └── pages/       # AuthPage, DashboardPage, FolderPage
├── server/          # Express backend
│   └── src/
│       ├── controllers/ # auth, folder, image, otp
│       ├── middleware/  # JWT protect, error handler
│       ├── models/      # User, Folder, Image, Otp
│       ├── routes/      # authRoutes, folderRoutes, imageRoutes
│       └── utils/       # multerConfig, jwtHelper, folderSizeHelper
├── mcp/             # MCP server (bonus)
├── Dockerfile       # Multi-stage: builds React, then runs Node server
└── fly.toml         # Fly.io deployment config
```

---

## Bonus — MCP Server

The `mcp/` directory contains an MCP-compatible server that exposes the FileSystem API as tools for AI assistants. Once configured, you can talk to Claude Desktop in plain English and it calls the API.

**Example prompts that work:**
- *"Create a folder called Campaigns inside Projects"*
- *"Show me everything inside my Marketing folder"*
- *"List all my folders and their sizes"*
- *"Rename the folder called Archive to Old Projects"*

**Tools exposed:** `list_folders`, `get_folder_contents`, `create_folder`, `delete_folder`, `rename_folder`, `list_images`, `delete_image`

**Setup (Claude Desktop):**

1. Get your JWT — log in at the live URL, open DevTools console, run `localStorage.getItem('token')`
2. Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/path/to/FileSystem/mcp/index.js"],
      "env": {
        "FILESYSTEM_API_URL": "https://filesystem-srijan.fly.dev/api",
        "FILESYSTEM_TOKEN": "your_jwt_token"
      }
    }
  }
}
```

3. Restart Claude Desktop — a tools icon will appear in chat.
