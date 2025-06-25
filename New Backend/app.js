const express = require("express");
const cors = require("cors");
const config = require("./config");
const nodeRoutes = require("./routes/nodes");

const app = express();

app.use(express.json());
app.use(cors(config.cors));
app.use(
  cors({
    origin: (origin, callback) => {
      if (origin === config.frontendUrl) {
        callback(null, true);
      } else {
        callback(new Error("Invalid or missing Origin header"));
      }
    },
    methods: ["GET"],
  })
);

app.use("/api/nodes", nodeRoutes);

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
