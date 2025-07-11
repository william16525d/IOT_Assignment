const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

app.post("/api/trash_event", (req, res) => {
  console.log("Received event:", req.body);
  res.send("Event received");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
