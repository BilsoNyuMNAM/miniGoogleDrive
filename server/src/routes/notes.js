const express = require("express");
const prisma = require("../lib/prisma");
const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");

const router = express.Router();

const notion = new Client({ auth: process.env.NOTION_API_KEY || "dummy" });
const n2m = new NotionToMarkdown({ notionClient: notion });

function extractNotionId(input) {
  if (!input) return null;
  const clean = input.trim();
  const match = clean.match(/[a-f0-9]{32}/i);
  if (match) return match[0];
  return clean;
}

// GET /api/notes - List all notes, optional ?search= filter
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;

    const where = search
      ? { title: { contains: search, mode: "insensitive" } }
      : {};

    const notes = await prisma.note.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(notes);
  } catch (error) {
    console.error("List notes error:", error);
    res.status(500).json({ error: "Failed to list notes" });
  }
});

// POST /api/notes - Create a new note
router.post("/", async (req, res) => {
  try {
    const { title, subtitle, content, notionId, notebookId } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : null,
        content: content || "",
        notionId: extractNotionId(notionId),
        notebookId:
          notebookId && notebookId !== "uncategorized" ? notebookId : null,
      },
    });

    res.status(201).json(note);
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// GET /api/notes/:id - Get single note
router.get("/:id", async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    console.error("Get note error:", error);
    res.status(500).json({ error: "Failed to get note" });
  }
});

// PATCH /api/notes/:id - Update a note
router.patch("/:id", async (req, res) => {
  try {
    const { title, subtitle, content, notionId, notebookId } = req.body;

    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (subtitle !== undefined) updateData.subtitle = subtitle ? subtitle.trim() : null;
    if (content !== undefined) updateData.content = content;
    if (notionId !== undefined) updateData.notionId = extractNotionId(notionId);
    if (notebookId !== undefined) {
      updateData.notebookId =
        notebookId && notebookId !== "uncategorized" ? notebookId : null;
    }

    const updatedNote = await prisma.note.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(updatedNote);
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// DELETE /api/notes/:id - Delete a note
router.delete("/:id", async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    await prisma.note.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// POST /api/notes/:id/sync-notion - Sync Notion content for a note
router.post("/:id/sync-notion", async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    if (!note.notionId) {
      return res.status(400).json({ error: "Note does not have a Notion ID" });
    }

    if (!process.env.NOTION_API_KEY) {
      return res.status(500).json({ error: "NOTION_API_KEY is not configured" });
    }

    const cleanNotionId = extractNotionId(note.notionId);
    if (!cleanNotionId) {
      return res.status(400).json({ error: "Invalid Notion ID format" });
    }

    const mdblocks = await n2m.pageToMarkdown(cleanNotionId);
    const mdString = n2m.toMarkdownString(mdblocks);
    const markdownContent = mdString.parent || "";

    const updatedNote = await prisma.note.update({
      where: { id: req.params.id },
      data: { content: markdownContent }
    });

    res.json(updatedNote);
  } catch (error) {
    console.error("Sync Notion error:", error);
    res.status(500).json({ 
      error: `Notion Error: ${error.message || 'Failed to sync content. Check your API key and Page ID.'}` 
    });
  }
});

module.exports = router;
