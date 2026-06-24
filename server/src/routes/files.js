const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

// ---------------------------------------------------------------------------
// Supabase Configuration
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || "http://placeholder.com", supabaseKey || "placeholder");
const BUCKET_NAME = "uploads";

// ---------------------------------------------------------------------------
// Multer memory storage
// ---------------------------------------------------------------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------------------------------------------------------------------
// POST /api/files  –  Upload a file with a title
// ---------------------------------------------------------------------------
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { title, folderId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Supabase configuration is missing" });
    }

    // Upload to Supabase Storage
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(req.file.originalname);
    const fileName = `${uniqueSuffix}${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload file to storage" });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const fileUrl = publicUrlData.publicUrl;

    const file = await prisma.file.create({
      data: {
        title: title.trim(),
        filename: fileName,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        folderId: folderId && folderId !== 'uncategorized' ? folderId : null,
      },
    });

    res.status(201).json(file);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/files  –  List all files (newest first), optional ?search= filter
// ---------------------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;

    const where = search
      ? { title: { contains: search, mode: "insensitive" } }
      : {};

    const files = await prisma.file.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(files);
  } catch (error) {
    console.error("List error:", error);
    res.status(500).json({ error: "Failed to list files" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/files/:id  –  Get single file metadata
// ---------------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json(file);
  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({ error: "Failed to get file" });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/files/:id  –  Delete file from storage + database
// ---------------------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Remove file from Supabase Storage
    if (supabaseUrl && supabaseKey) {
      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([file.filename]);

      if (removeError) {
        console.error("Supabase delete error:", removeError);
      }
    }

    // Remove database record
    await prisma.file.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/files/:id/move  –  Move a file to a different folder
// ---------------------------------------------------------------------------
router.patch("/:id/move", async (req, res) => {
  try {
    const { folderId } = req.body;
    
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const updatedFile = await prisma.file.update({
      where: { id: req.params.id },
      data: {
        folderId: folderId && folderId !== 'uncategorized' ? folderId : null,
      },
    });

    res.json(updatedFile);
  } catch (error) {
    console.error("Move error:", error);
    res.status(500).json({ error: "Failed to move file" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/files/:id/rename  –  Rename a file
// ---------------------------------------------------------------------------
router.patch("/:id/rename", async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const updatedFile = await prisma.file.update({
      where: { id: req.params.id },
      data: {
        title: title.trim(),
      },
    });

    res.json(updatedFile);
  } catch (error) {
    console.error("Rename error:", error);
    res.status(500).json({ error: "Failed to rename file" });
  }
});

module.exports = router;
