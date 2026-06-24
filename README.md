# 🗂️ MiniDrive — Your Personal File Library

A beautiful, full-stack file library application — like a mini Google Drive. Upload any file with a title, browse them in a stunning gallery, and preview or download with a click.

![Dark Theme](https://img.shields.io/badge/theme-dark-1a0a2e) ![React](https://img.shields.io/badge/React-18-61dafb) ![Express](https://img.shields.io/badge/Express-4-000) ![Prisma](https://img.shields.io/badge/Prisma-6-2d3748) ![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00e5a0)

## ✨ Features

- **Drag & drop file upload** with progress bar and title input
- **Beautiful gallery** with glassmorphic file cards
- **File preview** — images, PDFs, videos, and audio play inline
- **Search** files by title with debounced filtering
- **Delete** files with confirmation
- **Toast notifications** for all actions
- **Responsive** — works on desktop and mobile
- **Premium dark theme** with glassmorphism and gradient accents

## 🛠️ Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | React 18 (Vite)               |
| Backend    | Node.js + Express             |
| ORM        | Prisma                        |
| Database   | Neon (Serverless PostgreSQL)   |
| File Upload| Multer                        |
| Styling    | Vanilla CSS (Glassmorphism)   |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account with a database created

### 1. Clone & Install

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Database

Edit `server/.env` with your Neon connection strings (get these from your Neon dashboard):

```env
DATABASE_URL="postgresql://user:password@your-endpoint-pooler.region.aws.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@your-endpoint.region.aws.neon.tech/dbname?sslmode=require"
```

> **Note**: `DATABASE_URL` should use the **pooled** connection (contains `-pooler` in the hostname).
> `DIRECT_URL` should use the **direct** connection (no `-pooler`).

### 3. Run Database Migration

```bash
cd server
npx prisma migrate dev --name init
```

This creates the `File` table in your Neon database.

### 4. Start the App

Open **two terminal windows**:

```bash
# Terminal 1 — Backend (port 3001)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Visit **http://localhost:5173** in your browser!

## 📁 Project Structure

```
MINIGOOGLEDRIVE/
├── server/                    # Express backend
│   ├── prisma/schema.prisma   # Database schema
│   ├── src/
│   │   ├── index.js           # Server entry point
│   │   ├── lib/prisma.js      # Prisma client singleton
│   │   └── routes/files.js    # File CRUD API routes
│   ├── uploads/               # Uploaded files stored here
│   └── .env                   # Database connection strings
│
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx            # Main app shell
│   │   ├── index.css          # Design system & global styles
│   │   ├── utils.js           # Helper functions
│   │   └── components/
│   │       ├── FileUpload.jsx   # Drag & drop upload
│   │       ├── FileGallery.jsx  # File grid with search
│   │       ├── FileCard.jsx     # Individual file card
│   │       └── FilePreview.jsx  # Modal file viewer
│   └── vite.config.js         # Vite config with API proxy
│
└── README.md
```

## 🔌 API Endpoints

| Method   | Endpoint         | Description                     |
|----------|------------------|---------------------------------|
| `POST`   | `/api/files`     | Upload a file with title        |
| `GET`    | `/api/files`     | List all files (supports `?search=`) |
| `GET`    | `/api/files/:id` | Get single file metadata        |
| `DELETE` | `/api/files/:id` | Delete file from disk & database|

## 📝 License

MIT
