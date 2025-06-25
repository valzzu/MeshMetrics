const express = require("express");
const router = express.Router();
const { getNodesData } = require("../utils/data");

router.get("/", async (req, res, next) => {
  try {
    const nodes = await getNodesData();
    res.json(nodes);
  } catch (err) {
    next(err); // Pass error to global error handler
  }
});

module.exports = router;
