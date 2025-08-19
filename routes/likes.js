const express = require('express');
const router = express.Router();
const pool = require('../models/db');

router.post('/', async (req, res) => {
  const { post_id, author_name } = req.body;
  if (!post_id || !author_name) return res.status(400).json({ error: 'post_id와 author_name 필요' });

  try {
    const result = await pool.query(
      'INSERT INTO likes(post_id, author_name) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING *',
      [post_id, author_name]
    );
    res.json(result.rows[0] || { message: '이미 좋아요함' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', async (req, res) => {
  const { post_id, author_name } = req.body;
  try {
    const result = await pool.query(
      'DELETE FROM likes WHERE post_id=$1 AND author_name=$2 RETURNING *',
      [post_id, author_name]
    );
    if (!result.rows.length) return res.status(404).json({ error: '좋아요 없음' });
    res.json({ message: '좋아요 취소됨' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { post_id } = req.query;
  if (!post_id) return res.status(400).json({ error: 'post_id 필요' });

  try {
    const result = await pool.query('SELECT COUNT(*) FROM likes WHERE post_id=$1', [post_id]);
    res.json({ likes: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;