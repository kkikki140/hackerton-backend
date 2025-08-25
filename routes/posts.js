const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PostModel = require('../models/postModel'); // 🔥 추가

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const validCategories = [
  'free',
  'promotion_personal',
  'promotion_official',
  'news',
  'hot'
];

function isAdmin(req) {
  return req.headers['x-admin'] === 'true';
}

// 게시글 작성
router.post('/', upload.single('image'), async (req, res) => {
  const { author_name, title, content, category, ai_generated, location, allow_comments, tags } = req.body;
  const postCategory = validCategories.includes(category) ? category : 'free';

  if (postCategory === 'hot') return res.status(400).json({ error: 'HOT게시판 글은 작성할 수 없습니다.' });
  if (postCategory === 'promotion_official' && !(isAdmin(req) || ai_generated === 'true')) {
    return res.status(403).json({ error: '공식 지역 홍보 게시판 글 작성은 관리자/AI만 가능합니다.' });
  }
  if (!title || !content) return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });

  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO posts(author_name, title, content, category, image_url, location, allow_comments, tags)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        author_name || '익명',
        title,
        content,
        postCategory,
        image_url,
        location || null,
        allow_comments !== undefined ? allow_comments : true,
        tags || []
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 글 목록 조회
router.get('/', async (req, res) => {
  try {
    const { category, page, limit, search, sort } = req.query;
    const posts = await PostModel.findAll({ category, page, limit, search, sort }); // 🔥 Model 사용
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 특정 글 조회
router.get('/:id', async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id); // 🔥 Model 사용
    if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });

    // 조회수 증가
    await pool.query('UPDATE posts SET views = views + 1 WHERE id = $1 AND is_deleted = FALSE', [req.params.id]);

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 글 수정
router.put('/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, content, category, ai_generated, location, allow_comments, tags } = req.body;
  const postCategory = validCategories.includes(category) ? category : 'free';

  if (postCategory === 'hot') return res.status(400).json({ error: 'HOT게시판 글은 수정할 수 없습니다.' });
  if (postCategory === 'promotion_official' && !(isAdmin(req) || ai_generated === 'true')) {
    return res.status(403).json({ error: '공식 지역 홍보 게시판 글 수정은 관리자/AI만 가능합니다.' });
  }
  if (!title || !content) return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });

  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const fields = ['title', 'content', 'category', 'location', 'allow_comments', 'tags', 'updated_at'];
    const values = [title, content, postCategory, location || null, allow_comments !== undefined ? allow_comments : true, tags || [], new Date()];
    
    if (image_url) {
      fields.splice(3, 0, 'image_url'); // image_url 위치 추가
      values.splice(3, 0, image_url);
    }

    const setQuery = fields.map((f, i) => `${f}=$${i + 1}`).join(', ');
    values.push(id);

    const result = await pool.query(`UPDATE posts SET ${setQuery} WHERE id=$${values.length} AND is_deleted = FALSE RETURNING *`, values);
    
    if (!result.rows.length) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 글 삭제 (소프트 삭제 + 댓글 소프트 삭제)
router.delete('/:id', async (req, res) => {
  const postId = req.params.id;
  try {
    const postCheck = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (!postCheck.rows.length) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    if (postCheck.rows[0].is_deleted) return res.status(400).json({ error: '이미 삭제된 글입니다.' });

    await pool.query('UPDATE posts SET is_deleted = TRUE WHERE id = $1', [postId]);
    await pool.query('UPDATE comments SET is_deleted = TRUE WHERE post_id = $1', [postId]);

    res.json({ message: '게시글과 해당 댓글이 삭제되었습니다.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI 글 작성
router.post('/ai/create', async (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content) return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
  if (category !== 'promotion_official' && category !== 'news') return res.status(400).json({ error: 'AI는 promotion_official 또는 news만 작성 가능합니다.' });

  try {
    const result = await pool.query(
      'INSERT INTO posts(author_name, title, content, category) VALUES($1,$2,$3,$4) RETURNING *',
      ['AI', title, content, category]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;