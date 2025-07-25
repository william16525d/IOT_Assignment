const express = require("express");
const cors = require("cors");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// POST /api/clear — record new clear timestamp
app.post("/api/clear", async (req, res) => {
  try {
    const newClear = await prisma.clearEvent.create({});
    res.json({ success: true, timestamp: newClear.timestamp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// GET /api/last-cleared — return latest timestamp
app.get("/api/last-cleared", async (req, res) => {
  try {
    const last = await prisma.clearEvent.findFirst({
      orderBy: { timestamp: "desc" },
    });
    res.json({ timestamp: last?.timestamp || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// Serve index.html only on root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
