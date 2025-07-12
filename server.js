const express = require("express");
const app = express();
const port = 3000;

const events = [];

app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/trash_event", (req, res) => {
  const { event } = req.body;
  if (!event) return res.status(400).send("Missing event");

  const timestamp = new Date().toISOString();
  const data = { event, timestamp };
  events.push(data);

  console.log("Received event:", data);
  res.status(200).json({ message: "Event received", data });
});

app.get("/api/trash_event", (req, res) => {
  res.json(events);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
