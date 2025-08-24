const express = require('express');
const router = express.Router();
const pool = require('../models/db'); // DB 연결

// 1. 문의 작성
router.post('/', async (req, res) => {
  const { user_name, content } = req.body;
  if (!user_name || !content) {
    return res.status(400).json({ error: 'user_name과 content는 필수입니다.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO inquiries (user_name, content) VALUES ($1, $2) RETURNING id',
      [user_name, content]
    );
    res.status(201).json({ id: result.rows[0].id, message: '문의가 등록되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 2. 문의 목록 조회 (운영자용)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 3. 문의 답변 달기 (운영자용)
router.put('/:id/answer', async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  if (!answer) {
    return res.status(400).json({ error: 'answer는 필수입니다.' });
  }

  try {
    const result = await pool.query(
      'UPDATE inquiries SET answer = $1, answered_at = NOW() WHERE id = $2 RETURNING id',
      [answer, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '해당 문의를 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '답변이 등록되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;