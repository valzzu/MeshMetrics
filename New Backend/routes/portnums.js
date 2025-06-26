const express = require("express");
const router = express.Router();
const schemas = require("../schemas");

/**
 * GET /api/portnums
 * Returns counts of packets by portnum, sorted by count descending.
 */
router.get("/", async (req, res, next) => {
  try {
    const counts = await schemas.portnumCount
      .find()
      .sort({ count: -1 })
      .lean()
      .select("portnum count last_updated");
    res.json(counts);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
