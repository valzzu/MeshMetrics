const express = require("express");
const cors = require("cors");
const config = require("./config");
const nodeRoutes = require("./routes/nodes");
const portnumRoutes = require("./routes/portnums");
const packetRoutes = require("./routes/packets");

const app = express();

app.use(express.json());
app.use(cors(config.cors));

app.use("/api/nodes", nodeRoutes);
app.use("/api/portnums", portnumRoutes);
app.use("/api/packets", packetRoutes);

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
