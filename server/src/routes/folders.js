const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// GET /api/folders - List all folders with their files
router.get("/", async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      include: {
        files: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    
    // Also fetch uncategorized files (files without a folder)
    const uncategorizedFiles = await prisma.file.findMany({
      where: {
        folderId: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      files: folder.files,
    }));

    // Add uncategorized folder if there are any files
    if (uncategorizedFiles.length > 0 || response.length === 0) {
      response.push({
        id: "uncategorized",
        name: "Uncategorized",
        files: uncategorizedFiles,
      });
    }

    res.json(response);
  } catch (error) {
    console.error("List folders error:", error);
    res.status(500).json({ error: "Failed to list folders" });
  }
});

// POST /api/folders - Create a new folder
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Folder name is required" });
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
      },
      include: {
        files: true,
      }
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error("Create folder error:", error);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

// DELETE /api/folders/:id - Delete a folder
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === "uncategorized") {
      return res.status(400).json({ error: "Cannot delete Uncategorized folder" });
    }

    const folder = await prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    await prisma.folder.delete({
      where: { id },
    });

    res.json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Delete folder error:", error);
    res.status(500).json({ error: "Failed to delete folder" });
  }
});

module.exports = router;
