const express = require('express');
const router = express.Router();
const { getPacketsPerNode } = require('../utils/data');

/**
 * GET /api/packets
 * Returns packet counts per node in the last 24 hours.
 */
router.get('/', async (req, res, next) => {
  try {
    const packets = await getPacketsPerNode();
    res.json(packets);
  } catch (err) {
    next(err);
  }
});

module.exports = router;