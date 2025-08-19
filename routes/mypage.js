const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// 내가 쓴 게시글 조회
router.get('/posts', async (req, res) => {
  const { author_name } = req.query; // 쿼리 파라미터: author_name
  try {
    const result = await pool.query(
      'SELECT id, author_name, title, content, created_at, updated_at FROM posts WHERE author_name=$1 ORDER BY created_at DESC',
      [author_name || '익명']
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 관심 이벤트 조회
router.get('/events', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM events WHERE is_public=true ORDER BY event_date ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;