 
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fileRoutes = require("./routes/files");
const folderRoutes = require("./routes/folders");
const noteRoutes = require("./routes/notes");
const notebookRoutes = require("./routes/notebooks");

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Serve uploaded files as static assets at /uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/notebooks", notebookRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ---------------------------------------------------------------------------
// Serve React Client (Production)
// ---------------------------------------------------------------------------
const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
