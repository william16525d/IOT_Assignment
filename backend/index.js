const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.redirect("/auth.html");
});

app.use(express.static(path.join(__dirname, "../frontend")));

app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, message: "Signup failed." });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "15m",
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/clear", async (req, res) => {
  try {
    const newClear = await prisma.clearEvent.create({});
    res.json({ success: true, timestamp: newClear.timestamp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

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

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
