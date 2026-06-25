const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// GET /api/notebooks - List all notebooks with their notes
router.get("/", async (req, res) => {
  try {
    const notebooks = await prisma.notebook.findMany({
      include: {
        notes: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Also fetch uncategorized notes (notes without a notebook)
    const uncategorizedNotes = await prisma.note.findMany({
      where: {
        notebookId: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response = notebooks.map((notebook) => ({
      id: notebook.id,
      name: notebook.name,
      notes: notebook.notes,
    }));

    // Add uncategorized notebook if there are any notes without a notebook
    if (uncategorizedNotes.length > 0 || response.length === 0) {
      response.push({
        id: "uncategorized",
        name: "General",
        notes: uncategorizedNotes,
      });
    }

    res.json(response);
  } catch (error) {
    console.error("List notebooks error:", error);
    res.status(500).json({ error: "Failed to list notebooks" });
  }
});

// POST /api/notebooks - Create a new notebook
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Notebook name is required" });
    }

    const notebook = await prisma.notebook.create({
      data: {
        name: name.trim(),
      },
      include: {
        notes: true,
      },
    });

    res.status(201).json(notebook);
  } catch (error) {
    console.error("Create notebook error:", error);
    res.status(500).json({ error: "Failed to create notebook" });
  }
});

// DELETE /api/notebooks/:id - Delete a notebook
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (id === "uncategorized") {
      return res.status(400).json({ error: "Cannot delete General notebook" });
    }

    const notebook = await prisma.notebook.findUnique({
      where: { id },
    });

    if (!notebook) {
      return res.status(404).json({ error: "Notebook not found" });
    }

    await prisma.notebook.delete({
      where: { id },
    });

    res.json({ message: "Notebook deleted successfully" });
  } catch (error) {
    console.error("Delete notebook error:", error);
    res.status(500).json({ error: "Failed to delete notebook" });
  }
});

module.exports = router;
