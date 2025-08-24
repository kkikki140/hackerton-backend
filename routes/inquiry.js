const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// 1:1 문의 POST
router.post('/', async (req, res) => {
  try {
    const { name, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({ success: false, error: '모든 필드가 필요합니다.' });
    }

    const result = await pool.query(
      "INSERT INTO inquiries (name, message) VALUES ($1, $2) RETURNING *",
      [name, message]
    );

    res.status(201).json({ success: true, inquiry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;