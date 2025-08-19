const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const multer = require('multer');
const path = require('path');

// 이미지 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'), // 업로드 폴더
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // 예: 169254325435.jpg
  }
});
const upload = multer({ storage });


// CREATE - 새 글 작성 (이미지 포함 가능)
router.post('/', upload.single('image'), async (req, res) => {
  const { author_name, title, content, category } = req.body;

  if (!title || !content) return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });

  const validCategories = ['free', 'question', 'promotion', 'news', 'hot'];
  const postCategory = validCategories.includes(category) ? category : 'free';
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      'INSERT INTO posts(author_name, title, content, category, image_url) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [author_name || '익명', title, content, postCategory, image_url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// READ - 글 목록 조회 (카테고리별 + 페이지네이션 + 검색 + 정렬)
router.get('/', async (req, res) => {
  const { category, page = 1, limit = 10, search, sort = 'desc' } = req.query;
  const offset = (page - 1) * limit;
  const validCategories = ['free', 'question', 'promotion', 'news', 'hot'];

  let baseQuery = 'SELECT * FROM posts';
  let params = [];
  let conditions = [];

  if (category && validCategories.includes(category)) {
    conditions.push(`category = $${params.length + 1}`);
    params.push(category);
  }
  if (search) {
    conditions.push(`title ILIKE $${params.length + 1}`);
    params.push(`%${search}%`);
  }

  if (conditions.length) baseQuery += ' WHERE ' + conditions.join(' AND ');
  baseQuery += ` ORDER BY created_at ${sort.toLowerCase() === 'asc' ? 'ASC' : 'DESC'} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const result = await pool.query(baseQuery, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// UPDATE - 글 수정 (이미지 포함 가능)
router.put('/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;

  if (!title || !content) return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });

  const validCategories = ['free', 'question', 'promotion', 'news', 'hot'];
  const postCategory = validCategories.includes(category) ? category : 'free';
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    let result;
    if (image_url) {
      result = await pool.query(
        'UPDATE posts SET title=$1, content=$2, category=$3, image_url=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
        [title, content, postCategory, image_url, id]
      );
    } else {
      result = await pool.query(
        'UPDATE posts SET title=$1, content=$2, category=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
        [title, content, postCategory, id]
      );
    }

    if (!result.rows.length) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE - 글 삭제
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM posts WHERE id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    res.json({ message: '글이 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;