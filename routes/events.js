const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// 이벤트 생성 (로그인 없이 가능)
router.post('/', async (req, res) => {
  const { title, description, start_date, end_date, location, is_public } = req.body;

  if (!title || !start_date || !end_date) 
    return res.status(400).json({ error: "필수값 누락" });

  try {
    const result = await pool.query(
      `INSERT INTO events(title, description, start_date, end_date, location, is_public)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description, start_date, end_date, location, is_public !== false] // 기본 true
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 이벤트 목록 조회 (옵션: 공개 여부 필터링)
router.get('/', async (req, res) => {
  const { public_only } = req.query; // 쿼리 파라미터로 공개 이벤트만
  try {
    let result;
    if (public_only === 'true') {
      result = await pool.query('SELECT * FROM events WHERE is_public=true ORDER BY start_date ASC');
    } else {
      result = await pool.query('SELECT * FROM events ORDER BY start_date ASC');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 이벤트 수정
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, start_date, end_date, location, is_public } = req.body;

  try {
    const result = await pool.query(
      `UPDATE events 
       SET title=$1, description=$2, start_date=$3, end_date=$4, location=$5, is_public=$6, updated_at=NOW() 
       WHERE id=$7 RETURNING *`,
      [title, description, start_date, end_date, location, is_public !== false, id]
    );

    if (!result.rows.length) return res.status(404).json({ error: "이벤트 없음" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 이벤트 삭제
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM events WHERE id=$1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "이벤트 없음" });
    res.json({ message: "삭제됨" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;